package worker

import (
	"encoding/json"
	"time"
)

type Job struct {
	ID         string
	JobType    string
	TenantID   string
	Payload    json.RawMessage
	Attempt    int
	MaxAttempts int
	RequestID  string
	TraceID    string
}

type AttemptOutcome struct {
	Job         Job
	StartedAt   time.Time
	ErrorClass  string
	ErrorDetail string
}

type HandlerFailure struct {
	Code      string
	Message   string
	Retryable bool
}

func (e *HandlerFailure) Error() string {
	if e == nil {
		return ""
	}
	if e.Message != "" {
		return e.Message
	}
	if e.Code != "" {
		return e.Code
	}
	return "handler failure"
}
