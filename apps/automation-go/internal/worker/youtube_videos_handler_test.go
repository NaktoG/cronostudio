package worker

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestYouTubeVideosHandlerMissingConfig(t *testing.T) {
	h := YouTubeVideosSyncHandler{}
	err := h.Handle(context.Background(), Job{TenantID: "tenant-1"})
	if err == nil {
		t.Fatal("expected config error")
	}
	hf, ok := err.(*HandlerFailure)
	if !ok || hf.Code != "CONFIG_ERROR" || hf.Retryable {
		t.Fatalf("unexpected error: %#v", err)
	}
}

func TestYouTubeVideosHandlerStatusMapping(t *testing.T) {
	t.Run("non-retryable on 422", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusUnprocessableEntity)
		}))
		defer ts.Close()

		h := YouTubeVideosSyncHandler{BaseURL: ts.URL, WebhookSecret: "secret", TimeoutSeconds: 5}
		err := h.Handle(context.Background(), Job{TenantID: "tenant-1"})
		if err == nil {
			t.Fatal("expected error")
		}
		hf := err.(*HandlerFailure)
		if hf.Retryable {
			t.Fatal("422 should be non-retryable")
		}
	})

	t.Run("retryable on 429", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusTooManyRequests)
		}))
		defer ts.Close()

		h := YouTubeVideosSyncHandler{BaseURL: ts.URL, WebhookSecret: "secret", TimeoutSeconds: 5}
		err := h.Handle(context.Background(), Job{TenantID: "tenant-1"})
		if err == nil {
			t.Fatal("expected error")
		}
		hf := err.(*HandlerFailure)
		if !hf.Retryable {
			t.Fatal("429 should be retryable")
		}
	})
}

func TestYouTubeVideosHandlerAcceptsNullOptionalFields(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()

	payload, _ := json.Marshal(map[string]any{"channelId": nil, "limit": nil})
	h := YouTubeVideosSyncHandler{BaseURL: ts.URL, WebhookSecret: "secret", TimeoutSeconds: 5}
	err := h.Handle(context.Background(), Job{TenantID: "tenant-1", Payload: payload})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
}
