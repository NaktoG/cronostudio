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

type YouTubeChannelsSyncHandler struct {
	BaseURL       string
	WebhookSecret string
	TimeoutSeconds int
	HTTPClient    *http.Client
}

type channelsPayload struct {
	YouTubeChannelID *string `json:"youtubeChannelId,omitempty"`
}

func (h YouTubeChannelsSyncHandler) Handle(ctx context.Context, job Job) error {
	if strings.TrimSpace(h.BaseURL) == "" || strings.TrimSpace(h.WebhookSecret) == "" {
		return &HandlerFailure{Code: "CONFIG_ERROR", Message: "missing base URL or webhook secret", Retryable: false}
	}

	var payload channelsPayload
	if len(job.Payload) > 0 {
		if err := json.Unmarshal(job.Payload, &payload); err != nil {
			return &HandlerFailure{Code: "VALIDATION_ERROR", Message: "invalid job payload", Retryable: false}
		}
	}

	requestBody := map[string]any{
		"tenantUserId": job.TenantID,
	}
	if payload.YouTubeChannelID != nil && strings.TrimSpace(*payload.YouTubeChannelID) != "" {
		requestBody["youtubeChannelId"] = strings.TrimSpace(*payload.YouTubeChannelID)
	}

	body, err := json.Marshal(requestBody)
	if err != nil {
		return &HandlerFailure{Code: "SERIALIZE_ERROR", Message: "could not marshal request", Retryable: false}
	}

	endpoint := strings.TrimRight(h.BaseURL, "/") + "/api/internal/automation/youtube/sync/channels"
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
			timeout = 45
		}
		client = &http.Client{Timeout: time.Duration(timeout) * time.Second}
	}

	resp, err := client.Do(req)
	if err != nil {
		return &HandlerFailure{Code: "UPSTREAM_UNAVAILABLE", Message: "failed to call web sync route", Retryable: true}
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
