package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port                string
	DatabaseURL         string
	WebBaseURL          string
	WebhookSecret       string
	ObservabilityEnabled bool
	ObservabilityEndpoint string
	JWTIssuer           string
	JWTAudience         string
	JWTPublicKeys       map[string]string
	JWTMaxSkewSeconds   int
	RateLimitPerMinute  int
	RequestTimeoutMilli int
}

func Load() (Config, error) {
	cfg := Config{
		Port:                getEnv("AUTOMATION_GO_PORT", "8081"),
		DatabaseURL:         strings.TrimSpace(os.Getenv("AUTOMATION_DB_URL")),
		WebBaseURL:          getEnv("AUTOMATION_WEB_BASE_URL", "http://localhost:3000"),
		WebhookSecret:       strings.TrimSpace(os.Getenv("AUTOMATION_WEBHOOK_SECRET")),
		ObservabilityEnabled: strings.EqualFold(strings.TrimSpace(os.Getenv("OBS_ENABLED")), "true"),
		ObservabilityEndpoint: strings.TrimSpace(os.Getenv("OBS_ENDPOINT")),
		JWTIssuer:           getEnv("AUTOMATION_JWT_ISSUER", "cronostudio-web"),
		JWTAudience:         getEnv("AUTOMATION_JWT_AUDIENCE", "automation-go"),
		JWTMaxSkewSeconds:   getEnvInt("AUTOMATION_JWT_MAX_SKEW_SEC", 30),
		RateLimitPerMinute:  getEnvInt("AUTOMATION_RATE_LIMIT_PER_MIN", 120),
		RequestTimeoutMilli: getEnvInt("AUTOMATION_REQUEST_TIMEOUT_MS", 10000),
	}

	keysRaw := strings.TrimSpace(os.Getenv("AUTOMATION_JWT_ED25519_PUBLIC_KEYS"))
	if keysRaw != "" {
		keys, err := parseKeyMap(keysRaw)
		if err != nil {
			return Config{}, err
		}
		cfg.JWTPublicKeys = keys
	}
	if cfg.JWTPublicKeys == nil {
		cfg.JWTPublicKeys = map[string]string{}
	}
	return cfg, nil
}

func parseKeyMap(raw string) (map[string]string, error) {
	items := strings.Split(raw, ",")
	out := make(map[string]string, len(items))
	for _, item := range items {
		pair := strings.Split(strings.TrimSpace(item), ":")
		if len(pair) != 2 {
			return nil, fmt.Errorf("invalid key map entry: %q", item)
		}
		kid := strings.TrimSpace(pair[0])
		key := strings.TrimSpace(pair[1])
		if kid == "" || key == "" {
			return nil, fmt.Errorf("invalid key map entry: %q", item)
		}
		out[kid] = key
	}
	return out, nil
}

func getEnv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}
