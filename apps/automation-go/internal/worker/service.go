package worker

import (
	"context"
	"errors"
	"log"
	"math/rand"
	"strings"
	"sync"
	"time"

	"cronostudio/apps/automation-go/internal/config"
	"cronostudio/apps/automation-go/internal/obs"
)

type Service struct {
	cfg     config.WorkerConfig
	repo    Repository
	handler Handler
	obs     *obs.Client
	rand    *rand.Rand
	randMu  sync.Mutex
	sem     chan struct{}
	wg      sync.WaitGroup
}

func NewService(cfg config.WorkerConfig, repo Repository, handler Handler, obsClient *obs.Client) *Service {
	return &Service{
		cfg:     cfg,
		repo:    repo,
		handler: handler,
		obs:     obsClient,
		rand:    rand.New(rand.NewSource(time.Now().UnixNano())),
		sem:     make(chan struct{}, cfg.Concurrency),
	}
}

func (s *Service) Run(ctx context.Context) error {
	ticker := time.NewTicker(time.Duration(s.cfg.PollMillis) * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			s.waitForInFlightWorkers()
			return nil
		case <-ticker.C:
			if err := s.pollOnce(ctx); err != nil {
				log.Printf("worker poll error: %v", err)
			}
		}
	}
}

func (s *Service) pollOnce(ctx context.Context) error {
	availableSlots := cap(s.sem) - len(s.sem)
	if availableSlots <= 0 {
		return nil
	}

	claimSize := s.cfg.BatchSize
	if claimSize > availableSlots {
		claimSize = availableSlots
	}

	jobs, err := s.repo.ClaimNextBatch(ctx, claimSize, s.cfg.WorkerID, s.cfg.LeaseSeconds)
	if err != nil {
		s.emit("automation.worker.poll_error", map[string]string{"workerId": s.cfg.WorkerID})
		return err
	}
	if len(jobs) > 0 {
		s.emitN("automation.worker.claimed", float64(len(jobs)), map[string]string{"workerId": s.cfg.WorkerID})
	}

	for _, job := range jobs {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case s.sem <- struct{}{}:
		}

		s.wg.Add(1)
		go func(job Job) {
			defer s.wg.Done()
			defer func() { <-s.sem }()
			s.processJob(ctx, job)
		}(job)
	}

	return nil
}

func (s *Service) processJob(ctx context.Context, job Job) {
	startedAt := time.Now().UTC()
	hbDone := make(chan struct{})
	lostLease := make(chan struct{}, 1)
	go s.heartbeatLoop(ctx, job.ID, hbDone, lostLease)

	jobTimeout := s.cfg.JobTimeoutSeconds
	if job.JobType == "youtube.analytics.ingest.daily" && jobTimeout < 120 {
		jobTimeout = 120
	}

	jobCtx, cancel := context.WithTimeout(ctx, time.Duration(jobTimeout)*time.Second)
	err := s.handler.Handle(jobCtx, job)
	cancel()
	close(hbDone)

	select {
	case <-lostLease:
		log.Printf("worker lost lease job=%s", job.ID)
		return
	default:
	}

	outcome := AttemptOutcome{Job: job, StartedAt: startedAt}
	finalizeCtx, finalizeCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer finalizeCancel()
	if err == nil {
		ok, markErr := s.repo.MarkSucceeded(finalizeCtx, s.cfg.WorkerID, outcome)
		if markErr != nil {
			log.Printf("mark success failed job=%s err=%v", job.ID, markErr)
			s.emit("automation.job.finalize_error", map[string]string{"jobType": job.JobType, "outcome": "success"})
			return
		}
		if !ok {
			log.Printf("mark success skipped stale job=%s", job.ID)
			s.emit("automation.job.finalize_stale", map[string]string{"jobType": job.JobType, "outcome": "success"})
		}
		s.emit("automation.job.succeeded", map[string]string{"jobType": job.JobType})
		return
	}

	code, retryable := classify(err)
	message := truncate(err.Error(), 500)
	if retryable && job.Attempt < job.MaxAttempts {
		delay := s.backoff(job.Attempt)
		nextRun := time.Now().UTC().Add(delay)
		ok, markErr := s.repo.MarkRetry(finalizeCtx, s.cfg.WorkerID, outcome, nextRun, code, message)
		if markErr != nil {
			log.Printf("mark retry failed job=%s err=%v", job.ID, markErr)
			s.emit("automation.job.finalize_error", map[string]string{"jobType": job.JobType, "outcome": "retry"})
			return
		}
		if !ok {
			log.Printf("mark retry skipped stale job=%s", job.ID)
			s.emit("automation.job.finalize_stale", map[string]string{"jobType": job.JobType, "outcome": "retry"})
		}
		s.emit("automation.job.retry", map[string]string{"jobType": job.JobType, "code": code})
		return
	}

	reason := "terminal failure"
	if !retryable {
		reason = "non-retryable failure"
	}
	ok, markErr := s.repo.MarkDead(finalizeCtx, s.cfg.WorkerID, outcome, code, message, reason, retryable)
	if markErr != nil {
		log.Printf("mark dead failed job=%s err=%v", job.ID, markErr)
		s.emit("automation.job.finalize_error", map[string]string{"jobType": job.JobType, "outcome": "dead"})
		return
	}
	if !ok {
		log.Printf("mark dead skipped stale job=%s", job.ID)
		s.emit("automation.job.finalize_stale", map[string]string{"jobType": job.JobType, "outcome": "dead"})
	}
	s.emit("automation.job.dlq", map[string]string{"jobType": job.JobType, "code": code})
}

func (s *Service) heartbeatLoop(ctx context.Context, jobID string, done <-chan struct{}, lostLease chan<- struct{}) {
	interval := time.Duration(s.cfg.LeaseSeconds) * time.Second / 3
	if interval < time.Second {
		interval = time.Second
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-done:
			return
		case <-ticker.C:
			ok, err := s.repo.ExtendLease(ctx, jobID, s.cfg.WorkerID, s.cfg.LeaseSeconds)
			if err != nil {
				log.Printf("heartbeat failed job=%s err=%v", jobID, err)
				s.emit("automation.worker.heartbeat_error", map[string]string{"workerId": s.cfg.WorkerID})
				continue
			}
			if !ok {
				select {
				case lostLease <- struct{}{}:
				default:
				}
				return
			}
		}
	}
}

func (s *Service) emit(name string, tags map[string]string) {
	s.emitN(name, 1, tags)
}

func (s *Service) emitN(name string, value float64, tags map[string]string) {
	if s.obs == nil {
		return
	}
	s.obs.EmitCounterAsync(name, value, tags)
}

func (s *Service) backoff(attempt int) time.Duration {
	base := float64(s.cfg.RetryBaseMillis)
	max := float64(s.cfg.RetryMaxMillis)
	multiplier := 1 << maxInt(0, attempt-1)
	delay := base * float64(multiplier)
	if delay > max {
		delay = max
	}
	jitter := delay * (s.randFloat() * 0.2)
	return time.Duration(delay+jitter) * time.Millisecond
}

func (s *Service) randFloat() float64 {
	s.randMu.Lock()
	defer s.randMu.Unlock()
	return s.rand.Float64()
}

func (s *Service) waitForInFlightWorkers() {
	s.wg.Wait()
}

func classify(err error) (string, bool) {
	if err == nil {
		return "", false
	}

	var hf *HandlerFailure
	if errors.As(err, &hf) {
		code := hf.Code
		if code == "" {
			code = "HANDLER_FAILURE"
		}
		return code, hf.Retryable
	}

	if errors.Is(err, context.DeadlineExceeded) {
		return "TIMEOUT", true
	}

	if errors.Is(err, context.Canceled) {
		return "CANCELED", true
	}

	return "TRANSIENT_ERROR", true
}

func truncate(v string, n int) string {
	v = strings.TrimSpace(v)
	if len(v) <= n {
		return v
	}
	if n <= 3 {
		return v[:n]
	}
	return v[:n-3] + "..."
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}
