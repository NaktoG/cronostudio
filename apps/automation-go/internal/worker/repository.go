package worker

import (
	"context"
	"time"
)

type Repository interface {
	ClaimNextBatch(ctx context.Context, batchSize int, workerID string, leaseSeconds int) ([]Job, error)
	ExtendLease(ctx context.Context, jobID string, workerID string, leaseSeconds int) (bool, error)
	MarkSucceeded(ctx context.Context, workerID string, outcome AttemptOutcome) (bool, error)
	MarkRetry(ctx context.Context, workerID string, outcome AttemptOutcome, nextRunAt time.Time, code string, message string) (bool, error)
	MarkDead(ctx context.Context, workerID string, outcome AttemptOutcome, code string, message string, reason string, retryable bool) (bool, error)
}
