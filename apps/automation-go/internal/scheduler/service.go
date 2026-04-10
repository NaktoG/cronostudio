package scheduler

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"time"

	"cronostudio/apps/automation-go/internal/config"
	"cronostudio/apps/automation-go/internal/obs"
)

type Service struct {
	cfg         config.SchedulerConfig
	db          *sql.DB
	obs         *obs.Client
	lastRunDate string
}

func NewService(cfg config.SchedulerConfig, db *sql.DB, obsClient *obs.Client) *Service {
	return &Service{cfg: cfg, db: db, obs: obsClient}
}

func (s *Service) Run(ctx context.Context) error {
	ticker := time.NewTicker(time.Duration(s.cfg.PollSeconds) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			if !s.cfg.Enabled || !s.cfg.ScheduleAnalyticsDaily {
				continue
			}
			if err := s.tick(ctx); err != nil {
				log.Printf("scheduler tick error: %v", err)
				s.emit("automation.scheduler.tick_error", map[string]string{})
			}
		}
	}
}

func (s *Service) tick(ctx context.Context) error {
	now := time.Now().UTC()
	if now.Hour() != s.cfg.DailyHourUTC || now.Minute() != s.cfg.DailyMinuteUTC {
		return nil
	}

	runDate := now.Format("2006-01-02")
	if runDate == s.lastRunDate {
		return nil
	}

	targetDate := now.Add(-24 * time.Hour).Format("2006-01-02")
	tenantIDs, err := s.listTenants(ctx)
	if err != nil {
		return err
	}

	if len(tenantIDs) == 0 {
		s.lastRunDate = runDate
		s.emit("automation.scheduler.no_tenants", map[string]string{})
		return nil
	}

	for _, tenantID := range tenantIDs {
		if err := s.enqueueDailyAnalytics(ctx, tenantID, targetDate); err != nil {
			log.Printf("scheduler enqueue error tenant=%s err=%v", tenantID, err)
			s.emit("automation.scheduler.enqueue_error", map[string]string{})
		} else {
			s.emit("automation.scheduler.enqueued", map[string]string{"jobType": "youtube.analytics.ingest.daily"})
		}
	}

	s.lastRunDate = runDate
	return nil
}

func (s *Service) listTenants(ctx context.Context) ([]string, error) {
	rows, err := s.db.QueryContext(ctx, `
        SELECT DISTINCT user_id::text
        FROM youtube_integrations
        WHERE user_id IS NOT NULL
    `)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]string, 0)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		out = append(out, id)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return out, nil
}

func (s *Service) enqueueDailyAnalytics(ctx context.Context, tenantID string, targetDate string) error {
	payloadBytes, err := json.Marshal(map[string]any{
		"date":   targetDate,
		"source": "scheduler",
	})
	if err != nil {
		return err
	}

	_, err = s.db.ExecContext(ctx, `
        INSERT INTO automation_job_queue (job_type, tenant_user_id, payload, state, priority, attempt, max_attempts, run_at)
        SELECT 'youtube.analytics.ingest.daily', $1::uuid, $2::jsonb, 'queued', $3, 0, $4, NOW()
        WHERE NOT EXISTS (
            SELECT 1
            FROM automation_job_queue q
            WHERE q.job_type = 'youtube.analytics.ingest.daily'
              AND q.tenant_user_id = $1::uuid
              AND q.payload->>'date' = $5
              AND q.state IN ('queued', 'running', 'succeeded')
        )
    `, tenantID, string(payloadBytes), s.cfg.JobPriority, s.cfg.MaxAttempts, targetDate)
	return err
}

func (s *Service) emit(name string, tags map[string]string) {
	if s.obs == nil {
		return
	}
	s.obs.EmitCounterAsync(name, 1, tags)
}
