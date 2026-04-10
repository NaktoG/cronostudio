package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"

	"cronostudio/apps/automation-go/internal/config"
	"cronostudio/apps/automation-go/internal/obs"
	"cronostudio/apps/automation-go/internal/scheduler"
)

func main() {
	baseCfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}
	if baseCfg.DatabaseURL == "" {
		log.Fatal("AUTOMATION_DB_URL is required for scheduler")
	}

	schedulerCfg, err := config.LoadScheduler()
	if err != nil {
		log.Fatalf("scheduler config error: %v", err)
	}

	db, err := sql.Open("pgx", baseCfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db open error: %v", err)
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetConnMaxIdleTime(10 * time.Minute)
	if err := db.PingContext(context.Background()); err != nil {
		log.Fatalf("db ping error: %v", err)
	}
	defer func() { _ = db.Close() }()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	obsClient := obs.New(baseCfg.ObservabilityEnabled, baseCfg.ObservabilityEndpoint, "automation-go-scheduler")
	svc := scheduler.NewService(schedulerCfg, db, obsClient)
	log.Printf(
		"scheduler started enabled=%t analyticsDaily=%t schedule=%02d:%02d UTC",
		schedulerCfg.Enabled,
		schedulerCfg.ScheduleAnalyticsDaily,
		schedulerCfg.DailyHourUTC,
		schedulerCfg.DailyMinuteUTC,
	)

	err = svc.Run(ctx)
	if err != nil && !errors.Is(err, context.Canceled) {
		log.Printf("scheduler stopped with error: %v", err)
	}
}
