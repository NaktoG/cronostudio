package store

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"sync"
	"time"
)

var ErrIdempotencyConflict = errors.New("idempotency key conflict")

type EnqueueRequest struct {
	Scope          string
	IdempotencyKey string
	RequestHash    string
	JobType        string
	TenantUserID   string
	Payload        json.RawMessage
	Priority       int
	RunAt          time.Time
	RequestID      string
	TraceID        string
}

type EnqueueResponse struct {
	JobID     string `json:"jobId"`
	State     string `json:"state"`
	Replayed  bool   `json:"replayed,omitempty"`
	CreatedAt string `json:"createdAt"`
}

type Store interface {
	Enqueue(context.Context, EnqueueRequest) (EnqueueResponse, error)
}

type ReadyChecker interface {
	Ready(context.Context) error
	Mode() string
}

type MemoryStore struct {
	mu          sync.Mutex
	byScopeKey  map[string]idempotencyRecord
	jobsByID    map[string]EnqueueResponse
}

type idempotencyRecord struct {
	RequestHash string
	Response    EnqueueResponse
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		byScopeKey: make(map[string]idempotencyRecord),
		jobsByID:   make(map[string]EnqueueResponse),
	}
}

func (s *MemoryStore) Enqueue(_ context.Context, req EnqueueRequest) (EnqueueResponse, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	key := req.Scope + "::" + req.IdempotencyKey
	existing, ok := s.byScopeKey[key]
	if ok {
		if existing.RequestHash != req.RequestHash {
			return EnqueueResponse{}, ErrIdempotencyConflict
		}
		replay := existing.Response
		replay.Replayed = true
		return replay, nil
	}

	now := time.Now().UTC()
	jobID := newJobID()
	response := EnqueueResponse{
		JobID:     jobID,
		State:     "queued",
		CreatedAt: now.Format(time.RFC3339),
	}

	s.byScopeKey[key] = idempotencyRecord{RequestHash: req.RequestHash, Response: response}
	s.jobsByID[jobID] = response

	return response, nil
}

func (s *MemoryStore) Ready(_ context.Context) error {
	return nil
}

func (s *MemoryStore) Mode() string {
	return "memory"
}

func newJobID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return hex.EncodeToString([]byte(time.Now().UTC().Format(time.RFC3339Nano)))
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	out := make([]byte, 36)
	hex.Encode(out[0:8], b[0:4])
	out[8] = '-'
	hex.Encode(out[9:13], b[4:6])
	out[13] = '-'
	hex.Encode(out[14:18], b[6:8])
	out[18] = '-'
	hex.Encode(out[19:23], b[8:10])
	out[23] = '-'
	hex.Encode(out[24:36], b[10:16])
	return string(out)
}
