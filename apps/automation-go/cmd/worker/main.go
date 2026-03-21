package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"os/signal"
	"strings"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"

	"cronostudio/apps/automation-go/internal/config"
	"cronostudio/apps/automation-go/internal/obs"
	"cronostudio/apps/automation-go/internal/worker"
)

func main() {
	baseCfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}
	if baseCfg.DatabaseURL == "" {
		log.Fatal("AUTOMATION_DB_URL is required for worker")
	}

	workerCfg, err := config.LoadWorker()
	if err != nil {
		log.Fatalf("worker config error: %v", err)
	}
	if !workerCfg.ShadowMode {
		log.Fatal("AUTOMATION_WORKER_SHADOW_MODE must be true in this MVP phase")
	}

	db, err := sql.Open("pgx", baseCfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db open error: %v", err)
	}
	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetConnMaxIdleTime(10 * time.Minute)
	if err := db.PingContext(context.Background()); err != nil {
		log.Fatalf("db ping error: %v", err)
	}
	defer func() { _ = db.Close() }()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	repo := worker.NewPostgresRepository(db)
	defaultHandler := worker.NoopHandler{ForceError: workerCfg.ForceError}
	router := worker.RouterHandler{DefaultHandler: defaultHandler}

	if workerCfg.EnableYouTubeChannels {
		if strings.TrimSpace(baseCfg.WebBaseURL) == "" {
			log.Fatal("AUTOMATION_WEB_BASE_URL is required when AUTOMATION_WORKER_ENABLE_YOUTUBE_CHANNELS=true")
		}
		if strings.TrimSpace(baseCfg.WebhookSecret) == "" {
			log.Fatal("AUTOMATION_WEBHOOK_SECRET is required when AUTOMATION_WORKER_ENABLE_YOUTUBE_CHANNELS=true")
		}

		router.YouTubeChannelsHandler = worker.YouTubeChannelsSyncHandler{
			BaseURL:       baseCfg.WebBaseURL,
			WebhookSecret: baseCfg.WebhookSecret,
			TimeoutSeconds: workerCfg.JobTimeoutSeconds,
		}
		log.Printf("youtube.sync.channels handler enabled")
	}

	if workerCfg.EnableYouTubeVideos {
		if strings.TrimSpace(baseCfg.WebBaseURL) == "" {
			log.Fatal("AUTOMATION_WEB_BASE_URL is required when AUTOMATION_WORKER_ENABLE_YOUTUBE_VIDEOS=true")
		}
		if strings.TrimSpace(baseCfg.WebhookSecret) == "" {
			log.Fatal("AUTOMATION_WEBHOOK_SECRET is required when AUTOMATION_WORKER_ENABLE_YOUTUBE_VIDEOS=true")
		}

		router.YouTubeVideosHandler = worker.YouTubeVideosSyncHandler{
			BaseURL:        baseCfg.WebBaseURL,
			WebhookSecret:  baseCfg.WebhookSecret,
			TimeoutSeconds: workerCfg.JobTimeoutSeconds,
		}
		log.Printf("youtube.sync.videos handler enabled")
	}

	if workerCfg.EnableYouTubeAnalyticsDaily {
		if strings.TrimSpace(baseCfg.WebBaseURL) == "" {
			log.Fatal("AUTOMATION_WEB_BASE_URL is required when AUTOMATION_WORKER_ENABLE_YOUTUBE_ANALYTICS_DAILY=true")
		}
		if strings.TrimSpace(baseCfg.WebhookSecret) == "" {
			log.Fatal("AUTOMATION_WEBHOOK_SECRET is required when AUTOMATION_WORKER_ENABLE_YOUTUBE_ANALYTICS_DAILY=true")
		}

		analyticsTimeout := workerCfg.JobTimeoutSeconds
		if analyticsTimeout < 120 {
			analyticsTimeout = 120
		}

		router.YouTubeAnalyticsDailyHandler = worker.YouTubeAnalyticsDailyIngestHandler{
			BaseURL:        baseCfg.WebBaseURL,
			WebhookSecret:  baseCfg.WebhookSecret,
			TimeoutSeconds: analyticsTimeout,
		}
		log.Printf("youtube.analytics.ingest.daily handler enabled")
	}

	obsClient := obs.New(baseCfg.ObservabilityEnabled, baseCfg.ObservabilityEndpoint, "automation-go-worker")
	svc := worker.NewService(workerCfg, repo, router, obsClient)

	log.Printf("automation worker started id=%s shadow=%t", workerCfg.WorkerID, workerCfg.ShadowMode)
	err = svc.Run(ctx)
	if err != nil && !errors.Is(err, context.Canceled) {
		log.Printf("worker stopped with error: %v", err)
	}
}
