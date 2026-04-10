package worker

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestYouTubeChannelsHandlerMissingConfig(t *testing.T) {
	h := YouTubeChannelsSyncHandler{}
	err := h.Handle(context.Background(), Job{TenantID: "tenant-1"})
	if err == nil {
		t.Fatal("expected config error")
	}
	hf, ok := err.(*HandlerFailure)
	if !ok || hf.Code != "CONFIG_ERROR" || hf.Retryable {
		t.Fatalf("unexpected error: %#v", err)
	}
}

func TestYouTubeChannelsHandlerStatusMapping(t *testing.T) {
	t.Run("non-retryable on 400", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusBadRequest)
		}))
		defer ts.Close()

		h := YouTubeChannelsSyncHandler{BaseURL: ts.URL, WebhookSecret: "secret", TimeoutSeconds: 5}
		err := h.Handle(context.Background(), Job{TenantID: "tenant-1"})
		if err == nil {
			t.Fatal("expected error")
		}
		hf := err.(*HandlerFailure)
		if hf.Retryable {
			t.Fatal("400 should be non-retryable")
		}
	})

	t.Run("retryable on 500", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
		}))
		defer ts.Close()

		h := YouTubeChannelsSyncHandler{BaseURL: ts.URL, WebhookSecret: "secret", TimeoutSeconds: 5}
		err := h.Handle(context.Background(), Job{TenantID: "tenant-1"})
		if err == nil {
			t.Fatal("expected error")
		}
		hf := err.(*HandlerFailure)
		if !hf.Retryable {
			t.Fatal("500 should be retryable")
		}
	})
}

func TestYouTubeChannelsHandlerAcceptsNullOptionalField(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()

	payload, _ := json.Marshal(map[string]any{"youtubeChannelId": nil})
	h := YouTubeChannelsSyncHandler{BaseURL: ts.URL, WebhookSecret: "secret", TimeoutSeconds: 5}
	err := h.Handle(context.Background(), Job{TenantID: "tenant-1", Payload: payload})
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
}
