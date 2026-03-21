package http

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"

	"cronostudio/apps/automation-go/internal/auth"
	"cronostudio/apps/automation-go/internal/config"
	"cronostudio/apps/automation-go/internal/store"
)

const enqueueScope = "automation:enqueue"

var uuidRegex = regexp.MustCompile(`^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[1-5][a-fA-F0-9]{3}-[89abAB][a-fA-F0-9]{3}-[a-fA-F0-9]{12}$`)

type Server struct {
	cfg      config.Config
	verifier *auth.Verifier
	store    store.Store
	ready    store.ReadyChecker
	limiter  *fixedWindowLimiter
}

type enqueueBody struct {
	JobType      string          `json:"jobType"`
	TenantUserID string          `json:"tenantUserId"`
	Payload      json.RawMessage `json:"payload"`
	Priority     int             `json:"priority"`
	RunAt        *time.Time      `json:"runAt,omitempty"`
}

func NewServer(cfg config.Config, verifier *auth.Verifier, st store.Store, ready store.ReadyChecker) http.Handler {
	s := &Server{
		cfg:      cfg,
		verifier: verifier,
		store:    st,
		ready:    ready,
		limiter:  newFixedWindowLimiter(cfg.RateLimitPerMinute),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", s.handleHealth)
	mux.HandleFunc("/readyz", s.handleReady)
	mux.HandleFunc("/internal/jobs", s.handleEnqueue)
	return mux
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"status": "ok", "service": "automation-go"})
}

func (s *Server) handleReady(w http.ResponseWriter, _ *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := s.ready.Ready(ctx); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{"status": "not_ready", "mode": s.ready.Mode()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"status": "ready", "mode": s.ready.Mode()})
}

func (s *Server) handleEnqueue(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is allowed")
		return
	}

	clientIP := remoteIP(r)
	if !s.limiter.Allow("ip:" + clientIP) {
		writeError(w, http.StatusTooManyRequests, "RATE_LIMITED", "Too many requests")
		return
	}

	requestID := strings.TrimSpace(r.Header.Get("X-Request-Id"))
	if requestID == "" {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "Missing X-Request-Id")
		return
	}
	if !isUUID(requestID) {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "X-Request-Id must be UUID")
		return
	}

	idemKey := strings.TrimSpace(r.Header.Get("Idempotency-Key"))
	if idemKey == "" {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "Missing Idempotency-Key")
		return
	}

	claims, err := s.authorize(r)
	if err != nil {
		switch {
		case errors.Is(err, errForbidden):
			writeError(w, http.StatusForbidden, "FORBIDDEN", "Insufficient scope")
		default:
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid credentials")
		}
		return
	}

	bodyBytes, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return
	}

	var body enqueueBody
	dec := json.NewDecoder(strings.NewReader(string(bodyBytes)))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&body); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Invalid payload")
		return
	}

	if body.JobType == "" || body.TenantUserID == "" || len(body.Payload) == 0 {
		writeError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Missing required fields")
		return
	}
	if !isUUID(body.TenantUserID) {
		writeError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "tenantUserId must be UUID")
		return
	}
	if !claimsAllowTenant(claims, body.TenantUserID) {
		writeError(w, http.StatusForbidden, "FORBIDDEN", "Token is not authorized for tenantUserId")
		return
	}

	if !s.limiter.Allow("tenant:" + body.TenantUserID + ":job:" + body.JobType) {
		writeError(w, http.StatusTooManyRequests, "RATE_LIMITED", "Too many requests for workflow")
		return
	}

	if body.Priority == 0 {
		body.Priority = 100
	}

	runAt := time.Now().UTC()
	if body.RunAt != nil {
		runAt = body.RunAt.UTC()
	}

	hash := sha256.Sum256(bodyBytes)
	requestHash := hex.EncodeToString(hash[:])

	ctx, cancel := context.WithTimeout(r.Context(), time.Duration(s.cfg.RequestTimeoutMilli)*time.Millisecond)
	defer cancel()

	resp, err := s.store.Enqueue(ctx, store.EnqueueRequest{
		Scope:          enqueueScope + ":" + body.JobType + ":" + body.TenantUserID,
		IdempotencyKey: idemKey,
		RequestHash:    requestHash,
		JobType:        body.JobType,
		TenantUserID:   body.TenantUserID,
		Payload:        body.Payload,
		Priority:       body.Priority,
		RunAt:          runAt,
		RequestID:      requestID,
		TraceID:        requestID,
	})
	if err != nil {
		if errors.Is(err, store.ErrIdempotencyConflict) {
			writeError(w, http.StatusConflict, "IDEMPOTENCY_CONFLICT", "Idempotency key reused with different payload")
			return
		}
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not enqueue job")
		return
	}

	status := http.StatusAccepted
	if resp.Replayed {
		status = http.StatusOK
	}

	writeJSON(w, status, resp)
}

var errForbidden = errors.New("forbidden")

func (s *Server) authorize(r *http.Request) (auth.Claims, error) {
	header := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(header, "Bearer ") {
		return auth.Claims{}, errors.New("missing bearer token")
	}

	claims, err := s.verifier.Verify(strings.TrimPrefix(header, "Bearer "))
	if err != nil {
		return auth.Claims{}, err
	}

	if !hasScope(claims.Scope, enqueueScope) {
		return auth.Claims{}, errForbidden
	}

	return claims, nil
}

func hasScope(all, expected string) bool {
	parts := strings.Fields(all)
	for _, part := range parts {
		if part == expected {
			return true
		}
	}
	return false
}

func claimsAllowTenant(claims auth.Claims, tenantUserID string) bool {
	if claims.TenantUserID != "" {
		return claims.TenantUserID == tenantUserID
	}
	for _, tenant := range claims.TenantIDs {
		if tenant == tenantUserID {
			return true
		}
	}
	return false
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]any{
		"error": map[string]any{
			"code":    code,
			"message": message,
		},
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func remoteIP(r *http.Request) string {
	xff := strings.TrimSpace(r.Header.Get("X-Forwarded-For"))
	if xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func isUUID(v string) bool {
	return uuidRegex.MatchString(v)
}

type fixedWindowLimiter struct {
	mu      sync.Mutex
	max     int
	window  time.Duration
	buckets map[string]windowBucket
}

type windowBucket struct {
	start time.Time
	count int
}

func newFixedWindowLimiter(max int) *fixedWindowLimiter {
	if max <= 0 {
		max = 120
	}
	return &fixedWindowLimiter{max: max, window: time.Minute, buckets: map[string]windowBucket{}}
}

func (l *fixedWindowLimiter) Allow(key string) bool {
	now := time.Now().UTC()
	l.mu.Lock()
	defer l.mu.Unlock()

	bucket, ok := l.buckets[key]
	if !ok || now.Sub(bucket.start) >= l.window {
		l.buckets[key] = windowBucket{start: now, count: 1}
		return true
	}

	if bucket.count >= l.max {
		return false
	}

	bucket.count++
	l.buckets[key] = bucket
	return true
}
