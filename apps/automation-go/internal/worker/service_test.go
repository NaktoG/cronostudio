package worker

import (
	"context"
	"errors"
	"testing"
	"time"

	"cronostudio/apps/automation-go/internal/config"
)

type testHandler struct {
	called bool
	err    error
}

func (h *testHandler) Handle(_ context.Context, _ Job) error {
	h.called = true
	return h.err
}

func TestClassifyHandlerFailure(t *testing.T) {
	code, retryable := classify(&HandlerFailure{Code: "AUTH_ERROR", Message: "unauthorized", Retryable: false})
	if code != "AUTH_ERROR" {
		t.Fatalf("expected AUTH_ERROR, got %s", code)
	}
	if retryable {
		t.Fatal("expected non-retryable")
	}
}

func TestClassifyTimeout(t *testing.T) {
	code, retryable := classify(context.DeadlineExceeded)
	if code != "TIMEOUT" {
		t.Fatalf("expected TIMEOUT, got %s", code)
	}
	if !retryable {
		t.Fatal("expected retryable")
	}
}

func TestBackoffGrowsAndCaps(t *testing.T) {
	svc := NewService(config.WorkerConfig{
		RetryBaseMillis: 100,
		RetryMaxMillis:  500,
		Concurrency:      1,
	}, nil, NoopHandler{}, nil)

	d1 := svc.backoff(1)
	d2 := svc.backoff(2)
	d10 := svc.backoff(10)

	if d2 < d1 {
		t.Fatalf("expected d2 >= d1, got d1=%v d2=%v", d1, d2)
	}
	if d10 > 600*time.Millisecond {
		t.Fatalf("expected capped backoff, got %v", d10)
	}
}

func TestTruncate(t *testing.T) {
	v := truncate("abcdef", 4)
	if v != "a..." {
		t.Fatalf("unexpected truncate output: %s", v)
	}
}

func TestClassifyGeneric(t *testing.T) {
	code, retryable := classify(errors.New("boom"))
	if code != "TRANSIENT_ERROR" || !retryable {
		t.Fatalf("unexpected classification: %s retry=%t", code, retryable)
	}
}

func TestRouterHandlerRoutesByJobType(t *testing.T) {
	defaultH := &testHandler{}
	ytH := &testHandler{}
	ytVideos := &testHandler{}
	ytAnalytics := &testHandler{}
	router := RouterHandler{DefaultHandler: defaultH, YouTubeChannelsHandler: ytH, YouTubeVideosHandler: ytVideos, YouTubeAnalyticsDailyHandler: ytAnalytics}

	err := router.Handle(context.Background(), Job{JobType: "youtube.sync.channels"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ytH.called || defaultH.called {
		t.Fatal("expected youtube handler to be called")
	}

	defaultH.called = false
	ytH.called = false
	err = router.Handle(context.Background(), Job{JobType: "unknown.job"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !defaultH.called || ytH.called {
		t.Fatal("expected default handler to be called")
	}

	defaultH.called = false
	ytH.called = false
	err = router.Handle(context.Background(), Job{JobType: "youtube.sync.videos"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ytVideos.called || defaultH.called {
		t.Fatal("expected videos handler to be called")
	}

	defaultH.called = false
	ytVideos.called = false
	err = router.Handle(context.Background(), Job{JobType: "youtube.analytics.ingest.daily"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ytAnalytics.called || defaultH.called {
		t.Fatal("expected analytics handler to be called")
	}
}
