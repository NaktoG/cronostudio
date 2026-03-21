package config

import (
	"fmt"
	"strings"
)

type SchedulerConfig struct {
	Enabled               bool
	PollSeconds           int
	DailyHourUTC          int
	DailyMinuteUTC        int
	JobPriority           int
	MaxAttempts           int
	ScheduleAnalyticsDaily bool
}

func LoadScheduler() (SchedulerConfig, error) {
	cfg := SchedulerConfig{
		Enabled:               getEnvBool("AUTOMATION_SCHEDULER_ENABLED", false),
		PollSeconds:           getEnvInt("AUTOMATION_SCHEDULER_POLL_SEC", 60),
		DailyHourUTC:          getEnvInt("AUTOMATION_SCHEDULER_DAILY_HOUR_UTC", 2),
		DailyMinuteUTC:        getEnvInt("AUTOMATION_SCHEDULER_DAILY_MINUTE_UTC", 0),
		JobPriority:           getEnvInt("AUTOMATION_SCHEDULER_JOB_PRIORITY", 100),
		MaxAttempts:           getEnvInt("AUTOMATION_SCHEDULER_MAX_ATTEMPTS", 6),
		ScheduleAnalyticsDaily: getEnvBool("AUTOMATION_SCHEDULER_ENABLE_YOUTUBE_ANALYTICS_DAILY", false),
	}

	if cfg.PollSeconds < 10 {
		return SchedulerConfig{}, fmt.Errorf("scheduler poll must be >= 10 seconds")
	}
	if cfg.DailyHourUTC < 0 || cfg.DailyHourUTC > 23 {
		return SchedulerConfig{}, fmt.Errorf("daily hour must be between 0 and 23")
	}
	if cfg.DailyMinuteUTC < 0 || cfg.DailyMinuteUTC > 59 {
		return SchedulerConfig{}, fmt.Errorf("daily minute must be between 0 and 59")
	}
	if cfg.JobPriority < 1 {
		return SchedulerConfig{}, fmt.Errorf("job priority must be >= 1")
	}
	if cfg.MaxAttempts < 1 {
		return SchedulerConfig{}, fmt.Errorf("max attempts must be >= 1")
	}

	if !cfg.Enabled && strings.EqualFold(strings.TrimSpace(getEnv("AUTOMATION_SCHEDULER_FORCE", "")), "true") {
		cfg.Enabled = true
	}

	return cfg, nil
}
