package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type PostgresStore struct {
	db *sql.DB
}

func NewPostgresStore(databaseURL string) (*PostgresStore, error) {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	return &PostgresStore{db: db}, nil
}

func (s *PostgresStore) Close() error {
	return s.db.Close()
}

func (s *PostgresStore) Ready(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	return s.db.PingContext(ctx)
}

func (s *PostgresStore) Mode() string {
	return "postgres"
}

func (s *PostgresStore) Enqueue(ctx context.Context, req EnqueueRequest) (EnqueueResponse, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return EnqueueResponse{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	ins, err := tx.ExecContext(ctx, `
        INSERT INTO automation_job_idempotency (scope, tenant_user_id, idempotency_key, request_hash, expires_at)
        VALUES ($1, $2::uuid, $3, $4, NOW() + INTERVAL '24 hours')
        ON CONFLICT DO NOTHING
    `, req.Scope, req.TenantUserID, req.IdempotencyKey, req.RequestHash)
	if err != nil {
		return EnqueueResponse{}, err
	}

	affected, err := ins.RowsAffected()
	if err != nil {
		return EnqueueResponse{}, err
	}

	if affected == 0 {
		var existingHash string
		var responseSnapshot []byte
		err = tx.QueryRowContext(ctx, `
            SELECT request_hash, response_snapshot
            FROM automation_job_idempotency
            WHERE scope = $1 AND tenant_user_id = $2::uuid AND idempotency_key = $3
            FOR UPDATE
        `, req.Scope, req.TenantUserID, req.IdempotencyKey).Scan(&existingHash, &responseSnapshot)
		if err != nil {
			return EnqueueResponse{}, err
		}

		if existingHash != req.RequestHash {
			return EnqueueResponse{}, ErrIdempotencyConflict
		}

		if len(responseSnapshot) > 0 {
			var replay EnqueueResponse
			if err := json.Unmarshal(responseSnapshot, &replay); err != nil {
				return EnqueueResponse{}, err
			}
			replay.Replayed = true
			if err := tx.Commit(); err != nil {
				return EnqueueResponse{}, err
			}
			return replay, nil
		}

		return EnqueueResponse{}, errors.New("idempotency entry exists without response snapshot")
	}

	var response EnqueueResponse
	var createdAt time.Time
	err = tx.QueryRowContext(ctx, `
        INSERT INTO automation_job_queue (job_type, tenant_user_id, payload, priority, max_attempts, run_at, state, request_id, trace_id)
        VALUES ($1, $2::uuid, $3::jsonb, $4, 5, $5, 'queued', $6, $7)
        RETURNING id::text, state, created_at
    `, req.JobType, req.TenantUserID, string(req.Payload), req.Priority, req.RunAt, req.RequestID, req.TraceID).Scan(
		&response.JobID,
		&response.State,
		&createdAt,
	)
	if err != nil {
		return EnqueueResponse{}, err
	}

	response.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	responseJSON, err := json.Marshal(response)
	if err != nil {
		return EnqueueResponse{}, err
	}

	_, err = tx.ExecContext(ctx, `
        UPDATE automation_job_idempotency
        SET status_code = 202,
            response_snapshot = $4::jsonb,
            job_id = $5,
            expires_at = NOW() + INTERVAL '24 hours'
        WHERE scope = $1 AND tenant_user_id = $2::uuid AND idempotency_key = $3
    `, req.Scope, req.TenantUserID, req.IdempotencyKey, string(responseJSON), response.JobID)
	if err != nil {
		return EnqueueResponse{}, err
	}

	if err := tx.Commit(); err != nil {
		return EnqueueResponse{}, err
	}

	return response, nil
}
