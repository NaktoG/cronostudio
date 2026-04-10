package obs

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"sync/atomic"
	"time"
)

type Client struct {
	enabled    bool
	endpoint   string
	service    string
	httpClient *http.Client
	sem        chan struct{}
	dropped    uint64
}

func New(enabled bool, endpoint string, service string) *Client {
	if strings.TrimSpace(service) == "" {
		service = "automation-go"
	}
	return &Client{
		enabled:  enabled && strings.TrimSpace(endpoint) != "",
		endpoint: strings.TrimSpace(endpoint),
		service:  service,
		httpClient: &http.Client{
			Timeout: 3 * time.Second,
		},
		sem: make(chan struct{}, 32),
	}
}

func (c *Client) EmitCounterAsync(name string, value float64, tags map[string]string) {
	if c == nil || !c.enabled {
		return
	}

	select {
	case c.sem <- struct{}{}:
		go func() {
			defer func() { <-c.sem }()
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			c.EmitCounter(ctx, name, value, tags)
		}()
	default:
		n := atomic.AddUint64(&c.dropped, 1)
		if n%100 == 0 {
			log.Printf("observability emit dropped count=%d", n)
		}
		return
	}
}

func (c *Client) EmitCounter(ctx context.Context, name string, value float64, tags map[string]string) {
	if c == nil || !c.enabled || name == "" {
		return
	}
	outTags := map[string]string{"service": c.service}
	for k, v := range tags {
		if strings.TrimSpace(k) == "" || strings.TrimSpace(v) == "" {
			continue
		}
		outTags[k] = v
	}

	payload := map[string]any{
		"name":  name,
		"value": value,
		"tags":  outTags,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(body))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return
	}
	defer func() {
		_, _ = io.Copy(io.Discard, resp.Body)
		_ = resp.Body.Close()
	}()
	if resp.StatusCode >= 400 {
		log.Printf("observability emit http status=%d", resp.StatusCode)
	}
}
