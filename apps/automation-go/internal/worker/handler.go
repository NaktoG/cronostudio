package worker

import "context"

type Handler interface {
	Handle(ctx context.Context, job Job) error
}
