package worker

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) ClaimNextBatch(ctx context.Context, batchSize int, workerID string, leaseSeconds int) ([]Job, error) {
	rows, err := r.db.QueryContext(ctx, `
        WITH candidate AS (
            SELECT id
            FROM automation_job_queue
            WHERE
                (state = 'queued' AND run_at <= NOW())
                OR (state = 'running' AND lease_until <= NOW())
            ORDER BY priority ASC, run_at ASC, created_at ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
        )
        UPDATE automation_job_queue q
        SET
            state = 'running',
            locked_by = $2,
            lease_until = NOW() + ($3 * INTERVAL '1 second'),
            attempt = q.attempt + 1,
            last_error_code = NULL,
            last_error_message = NULL
        FROM candidate
        WHERE q.id = candidate.id
        RETURNING q.id::text, q.job_type, q.tenant_user_id::text, q.payload, q.attempt, q.max_attempts, COALESCE(q.request_id, ''), COALESCE(q.trace_id, '');
    `, batchSize, workerID, leaseSeconds)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Job, 0, batchSize)
	for rows.Next() {
		var j Job
		var payload []byte
		if err := rows.Scan(&j.ID, &j.JobType, &j.TenantID, &payload, &j.Attempt, &j.MaxAttempts, &j.RequestID, &j.TraceID); err != nil {
			return nil, err
		}
		j.Payload = json.RawMessage(payload)
		out = append(out, j)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return out, nil
}

func (r *PostgresRepository) ExtendLease(ctx context.Context, jobID string, workerID string, leaseSeconds int) (bool, error) {
	res, err := r.db.ExecContext(ctx, `
        UPDATE automation_job_queue
        SET lease_until = NOW() + ($3 * INTERVAL '1 second')
        WHERE id = $1::uuid
          AND state = 'running'
          AND locked_by = $2;
    `, jobID, workerID, leaseSeconds)
	if err != nil {
		return false, err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	return affected > 0, nil
}

func (r *PostgresRepository) MarkSucceeded(ctx context.Context, workerID string, outcome AttemptOutcome) (bool, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer func() { _ = tx.Rollback() }()

	res, err := tx.ExecContext(ctx, `
        UPDATE automation_job_queue
        SET state = 'succeeded', lease_until = NULL, locked_by = NULL, updated_at = NOW()
        WHERE id = $1::uuid
          AND state = 'running'
          AND locked_by = $2;
    `, outcome.Job.ID, workerID)
	if err != nil {
		return false, err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	if affected == 0 {
		return false, tx.Commit()
	}

	if err := r.insertAttempt(ctx, tx, outcome, "success"); err != nil {
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}

func (r *PostgresRepository) MarkRetry(ctx context.Context, workerID string, outcome AttemptOutcome, nextRunAt time.Time, code string, message string) (bool, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer func() { _ = tx.Rollback() }()

	res, err := tx.ExecContext(ctx, `
        UPDATE automation_job_queue
        SET state = 'queued',
            run_at = $3,
            lease_until = NULL,
            locked_by = NULL,
            last_error_code = $4,
            last_error_message = $5,
            updated_at = NOW()
        WHERE id = $1::uuid
          AND state = 'running'
          AND locked_by = $2;
    `, outcome.Job.ID, workerID, nextRunAt.UTC(), code, message)
	if err != nil {
		return false, err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	if affected == 0 {
		return false, tx.Commit()
	}

	outcome.ErrorClass = code
	outcome.ErrorDetail = message
	if err := r.insertAttempt(ctx, tx, outcome, "retry"); err != nil {
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}

func (r *PostgresRepository) MarkDead(ctx context.Context, workerID string, outcome AttemptOutcome, code string, message string, reason string, retryable bool) (bool, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer func() { _ = tx.Rollback() }()

	res, err := tx.ExecContext(ctx, `
        UPDATE automation_job_queue
        SET state = 'dead',
            lease_until = NULL,
            locked_by = NULL,
            last_error_code = $3,
            last_error_message = $4,
            updated_at = NOW()
        WHERE id = $1::uuid
          AND state = 'running'
          AND locked_by = $2;
    `, outcome.Job.ID, workerID, code, message)
	if err != nil {
		return false, err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	if affected == 0 {
		return false, tx.Commit()
	}

	_, err = tx.ExecContext(ctx, `
        INSERT INTO automation_job_dlq (job_id, job_type, tenant_user_id, payload, failure_reason, retryable)
        SELECT id, job_type, tenant_user_id, payload, $2, $3
        FROM automation_job_queue
        WHERE id = $1::uuid
        ON CONFLICT (job_id) DO NOTHING;
    `, outcome.Job.ID, reason, retryable)
	if err != nil {
		return false, err
	}

	outcome.ErrorClass = code
	outcome.ErrorDetail = message
	if err := r.insertAttempt(ctx, tx, outcome, "dead"); err != nil {
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}

func (r *PostgresRepository) insertAttempt(ctx context.Context, tx *sql.Tx, outcome AttemptOutcome, result string) error {
	if outcome.StartedAt.IsZero() {
		outcome.StartedAt = time.Now().UTC()
	}

	_, err := tx.ExecContext(ctx, `
        INSERT INTO automation_job_attempts
        (job_id, attempt, started_at, finished_at, outcome, error_class, error_detail, request_id, trace_id)
        VALUES ($1::uuid, $2, $3, NOW(), $4, $5, $6, $7, $8);
    `,
		outcome.Job.ID,
		outcome.Job.Attempt,
		outcome.StartedAt.UTC(),
		result,
		nullableText(outcome.ErrorClass),
		nullableText(outcome.ErrorDetail),
		nullableText(outcome.Job.RequestID),
		nullableText(outcome.Job.TraceID),
	)
	if err != nil {
		return fmt.Errorf("insert attempt: %w", err)
	}
	return nil
}

func nullableText(v string) any {
	if v == "" {
		return nil
	}
	return v
}
