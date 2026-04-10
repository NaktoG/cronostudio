package config

import (
	"fmt"
	"os"
	"strings"
)

type WorkerConfig struct {
	WorkerID            string
	Concurrency         int
	BatchSize           int
	PollMillis          int
	LeaseSeconds        int
	RetryBaseMillis     int
	RetryMaxMillis      int
	JobTimeoutSeconds   int
	ShadowMode          bool
	EnableYouTubeChannels bool
	EnableYouTubeVideos bool
	EnableYouTubeAnalyticsDaily bool
	ForceError          bool
}

func LoadWorker() (WorkerConfig, error) {
	hostname, _ := os.Hostname()
	if hostname == "" {
		hostname = "automation-worker"
	}

	cfg := WorkerConfig{
		WorkerID:            getEnv("AUTOMATION_WORKER_ID", hostname),
		Concurrency:         getEnvInt("AUTOMATION_WORKER_CONCURRENCY", 4),
		BatchSize:           getEnvInt("AUTOMATION_WORKER_BATCH_SIZE", 10),
		PollMillis:          getEnvInt("AUTOMATION_WORKER_POLL_MS", 1000),
		LeaseSeconds:        getEnvInt("AUTOMATION_WORKER_LEASE_SEC", 30),
		RetryBaseMillis:     getEnvInt("AUTOMATION_WORKER_RETRY_BASE_MS", 1000),
		RetryMaxMillis:      getEnvInt("AUTOMATION_WORKER_RETRY_MAX_MS", 60000),
		JobTimeoutSeconds:   getEnvInt("AUTOMATION_WORKER_JOB_TIMEOUT_SEC", 30),
		ShadowMode:          getEnvBool("AUTOMATION_WORKER_SHADOW_MODE", true),
		EnableYouTubeChannels: getEnvBool("AUTOMATION_WORKER_ENABLE_YOUTUBE_CHANNELS", false),
		EnableYouTubeVideos: getEnvBool("AUTOMATION_WORKER_ENABLE_YOUTUBE_VIDEOS", false),
		EnableYouTubeAnalyticsDaily: getEnvBool("AUTOMATION_WORKER_ENABLE_YOUTUBE_ANALYTICS_DAILY", false),
		ForceError:          getEnvBool("AUTOMATION_WORKER_NOOP_FORCE_ERROR", false),
	}

	if strings.TrimSpace(cfg.WorkerID) == "" {
		return WorkerConfig{}, fmt.Errorf("worker id is required")
	}
	if cfg.Concurrency < 1 || cfg.BatchSize < 1 || cfg.PollMillis < 100 {
		return WorkerConfig{}, fmt.Errorf("invalid worker tuning values")
	}
	if cfg.LeaseSeconds < 5 {
		return WorkerConfig{}, fmt.Errorf("lease must be >= 5 seconds")
	}
	if cfg.RetryBaseMillis < 100 || cfg.RetryMaxMillis < cfg.RetryBaseMillis {
		return WorkerConfig{}, fmt.Errorf("invalid retry backoff config")
	}
	if cfg.JobTimeoutSeconds < 5 {
		return WorkerConfig{}, fmt.Errorf("job timeout must be >= 5 seconds")
	}
	return cfg, nil
}

func getEnvBool(key string, fallback bool) bool {
	v := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if v == "" {
		return fallback
	}
	switch v {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	default:
		return fallback
	}
}
