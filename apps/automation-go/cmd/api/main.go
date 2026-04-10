package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"cronostudio/apps/automation-go/internal/auth"
	"cronostudio/apps/automation-go/internal/config"
	httpserver "cronostudio/apps/automation-go/internal/http"
	"cronostudio/apps/automation-go/internal/store"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	verifier, err := auth.NewVerifier(cfg)
	if err != nil {
		log.Fatalf("jwt verifier error: %v", err)
	}

	var st store.Store
	var ready store.ReadyChecker
	if cfg.DatabaseURL != "" {
		pgStore, err := store.NewPostgresStore(cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("postgres store error: %v", err)
		}
		if err := pgStore.Ready(context.Background()); err != nil {
			log.Fatalf("postgres readiness error: %v", err)
		}
		defer func() {
			_ = pgStore.Close()
		}()
		st = pgStore
		ready = pgStore
	} else {
		mem := store.NewMemoryStore()
		st = mem
		ready = mem
	}

	handler := httpserver.NewServer(cfg, verifier, st, ready)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("automation-go api listening on :%s", cfg.Port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
