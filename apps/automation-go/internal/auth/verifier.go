package auth

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"cronostudio/apps/automation-go/internal/config"
)

type Verifier struct {
	issuer     string
	audience   string
	maxSkew    time.Duration
	publicKeys map[string]ed25519.PublicKey
}

type Claims struct {
	Issuer       string      `json:"iss"`
	Subject      string      `json:"sub"`
	Audience     interface{} `json:"aud"`
	IssuedAt     int64       `json:"iat"`
	NotBefore    int64       `json:"nbf"`
	ExpiresAt    int64       `json:"exp"`
	JWTID        string      `json:"jti"`
	Scope        string      `json:"scope"`
	TenantUserID string      `json:"tenantUserId"`
	TenantIDs    []string    `json:"tenantIds"`
}

type jwtHeader struct {
	Algorithm string `json:"alg"`
	Type      string `json:"typ"`
	KeyID     string `json:"kid"`
}

func NewVerifier(cfg config.Config) (*Verifier, error) {
	if len(cfg.JWTPublicKeys) == 0 {
		return nil, errors.New("missing AUTOMATION_JWT_ED25519_PUBLIC_KEYS")
	}

	keys := make(map[string]ed25519.PublicKey, len(cfg.JWTPublicKeys))
	for kid, keyB64 := range cfg.JWTPublicKeys {
		decoded, err := base64.RawURLEncoding.DecodeString(keyB64)
		if err != nil {
			return nil, fmt.Errorf("invalid key for kid %s: %w", kid, err)
		}
		if len(decoded) != ed25519.PublicKeySize {
			return nil, fmt.Errorf("invalid ed25519 key size for kid %s", kid)
		}
		keys[kid] = ed25519.PublicKey(decoded)
	}

	return &Verifier{
		issuer:     cfg.JWTIssuer,
		audience:   cfg.JWTAudience,
		maxSkew:    time.Duration(cfg.JWTMaxSkewSeconds) * time.Second,
		publicKeys: keys,
	}, nil
}

func (v *Verifier) Verify(raw string) (Claims, error) {
	parts := strings.Split(strings.TrimSpace(raw), ".")
	if len(parts) != 3 {
		return Claims{}, errors.New("invalid jwt format")
	}

	headBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return Claims{}, errors.New("invalid jwt header")
	}

	var head jwtHeader
	if err := json.Unmarshal(headBytes, &head); err != nil {
		return Claims{}, errors.New("invalid jwt header json")
	}

	if head.Algorithm != "EdDSA" || head.KeyID == "" {
		return Claims{}, errors.New("unsupported jwt algorithm or missing kid")
	}

	pub, ok := v.publicKeys[head.KeyID]
	if !ok {
		return Claims{}, errors.New("unknown kid")
	}

	sig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return Claims{}, errors.New("invalid jwt signature")
	}

	signed := []byte(parts[0] + "." + parts[1])
	if !ed25519.Verify(pub, signed, sig) {
		return Claims{}, errors.New("signature verification failed")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return Claims{}, errors.New("invalid jwt payload")
	}

	var claims Claims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return Claims{}, errors.New("invalid jwt claims")
	}

	if err := v.validateClaims(claims); err != nil {
		return Claims{}, err
	}

	return claims, nil
}

func (v *Verifier) validateClaims(c Claims) error {
	now := time.Now().Unix()
	maxSkew := int64(v.maxSkew.Seconds())

	if c.Issuer != v.issuer {
		return errors.New("invalid issuer")
	}

	if !audienceContains(c.Audience, v.audience) {
		return errors.New("invalid audience")
	}

	if c.ExpiresAt == 0 || now > c.ExpiresAt+maxSkew {
		return errors.New("token expired")
	}

	if c.NotBefore != 0 && now+maxSkew < c.NotBefore {
		return errors.New("token not active")
	}

	if c.IssuedAt == 0 || now+maxSkew < c.IssuedAt {
		return errors.New("invalid iat")
	}

	if c.Subject == "" || c.JWTID == "" {
		return errors.New("missing subject or jti")
	}

	return nil
}

func audienceContains(raw interface{}, expected string) bool {
	switch value := raw.(type) {
	case string:
		return value == expected
	case []interface{}:
		for _, item := range value {
			if s, ok := item.(string); ok && s == expected {
				return true
			}
		}
	}
	return false
}
