package worker

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type YouTubeAnalyticsDailyIngestHandler struct {
	BaseURL        string
	WebhookSecret  string
	TimeoutSeconds int
	HTTPClient     *http.Client
}

type analyticsDailyPayload struct {
	Date *string `json:"date,omitempty"`
}

func (h YouTubeAnalyticsDailyIngestHandler) Handle(ctx context.Context, job Job) error {
	if strings.TrimSpace(h.BaseURL) == "" || strings.TrimSpace(h.WebhookSecret) == "" {
		return &HandlerFailure{Code: "CONFIG_ERROR", Message: "missing base URL or webhook secret", Retryable: false}
	}

	var payload analyticsDailyPayload
	if len(job.Payload) > 0 {
		if err := json.Unmarshal(job.Payload, &payload); err != nil {
			return &HandlerFailure{Code: "VALIDATION_ERROR", Message: "invalid job payload", Retryable: false}
		}
	}

	requestBody := map[string]any{
		"tenantUserId": job.TenantID,
	}
	if payload.Date != nil && strings.TrimSpace(*payload.Date) != "" {
		requestBody["date"] = strings.TrimSpace(*payload.Date)
	}

	body, err := json.Marshal(requestBody)
	if err != nil {
		return &HandlerFailure{Code: "SERIALIZE_ERROR", Message: "could not marshal request", Retryable: false}
	}

	endpoint := strings.TrimRight(h.BaseURL, "/") + "/api/internal/automation/youtube/analytics/ingest-daily"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return &HandlerFailure{Code: "REQUEST_BUILD_ERROR", Message: "could not build request", Retryable: true}
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-cronostudio-webhook-secret", h.WebhookSecret)
	if job.RequestID != "" {
		req.Header.Set("x-request-id", job.RequestID)
	}

	client := h.HTTPClient
	if client == nil {
		timeout := h.TimeoutSeconds
		if timeout <= 0 {
			timeout = 60
		}
		client = &http.Client{Timeout: time.Duration(timeout) * time.Second}
	}

	resp, err := client.Do(req)
	if err != nil {
		return &HandlerFailure{Code: "UPSTREAM_UNAVAILABLE", Message: "failed to call internal ingest endpoint", Retryable: true}
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}

	if resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode >= 500 {
		return &HandlerFailure{Code: fmt.Sprintf("UPSTREAM_%d", resp.StatusCode), Message: "upstream transient error", Retryable: true}
	}

	return &HandlerFailure{Code: fmt.Sprintf("UPSTREAM_%d", resp.StatusCode), Message: "upstream non-retryable error", Retryable: false}
}
