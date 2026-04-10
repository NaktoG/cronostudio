package worker

import "context"

type NoopHandler struct {
	ForceError bool
}

func (h NoopHandler) Handle(_ context.Context, _ Job) error {
	if h.ForceError {
		return &HandlerFailure{
			Code:      "NOOP_FORCED_ERROR",
			Message:   "forced noop error for retry/dlq pipeline validation",
			Retryable: true,
		}
	}
	return nil
}
