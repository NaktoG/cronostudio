package worker

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestYouTubeAnalyticsDailyHandlerMissingConfig(t *testing.T) {
	h := YouTubeAnalyticsDailyIngestHandler{}
	err := h.Handle(context.Background(), Job{TenantID: "tenant-1"})
	if err == nil {
		t.Fatal("expected config error")
	}
	hf, ok := err.(*HandlerFailure)
	if !ok || hf.Code != "CONFIG_ERROR" || hf.Retryable {
		t.Fatalf("unexpected error: %#v", err)
	}
}

func TestYouTubeAnalyticsDailyHandlerStatusMapping(t *testing.T) {
	t.Run("retryable on 503", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusServiceUnavailable)
		}))
		defer ts.Close()

		h := YouTubeAnalyticsDailyIngestHandler{BaseURL: ts.URL, WebhookSecret: "secret", TimeoutSeconds: 5}
		err := h.Handle(context.Background(), Job{TenantID: "tenant-1"})
		if err == nil {
			t.Fatal("expected error")
		}
		hf := err.(*HandlerFailure)
		if !hf.Retryable {
			t.Fatal("503 should be retryable")
		}
	})

	t.Run("non-retryable on 400", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusBadRequest)
		}))
		defer ts.Close()

		h := YouTubeAnalyticsDailyIngestHandler{BaseURL: ts.URL, WebhookSecret: "secret", TimeoutSeconds: 5}
		err := h.Handle(context.Background(), Job{TenantID: "tenant-1"})
		if err == nil {
			t.Fatal("expected error")
		}
		hf := err.(*HandlerFailure)
		if hf.Retryable {
			t.Fatal("400 should be non-retryable")
		}
	})
}

func TestYouTubeAnalyticsDailyHandlerAcceptsOptionalDate(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()

	date := "2026-03-20"
	payload, _ := json.Marshal(map[string]any{"date": date})
	h := YouTubeAnalyticsDailyIngestHandler{BaseURL: ts.URL, WebhookSecret: "secret", TimeoutSeconds: 5}
	err := h.Handle(context.Background(), Job{TenantID: "tenant-1", Payload: payload})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
}
