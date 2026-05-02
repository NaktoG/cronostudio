#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-"http://localhost:3000"}
ENDPOINT="$BASE_URL/api/assistant/chat"

tmp_body=$(mktemp)
trap 'rm -f "$tmp_body"' EXIT

status=$(curl -sS -o "$tmp_body" -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d '{"message":"ping"}' \
  "$ENDPOINT")

echo "assistant_endpoint=$ENDPOINT"
echo "http_status=$status"
echo "response=$(cat "$tmp_body")"

case "$status" in
  200)
    echo "result=ok"
    ;;
  401)
    echo "result=ok_protected_endpoint"
    echo "hint=Assistant API reachable and protected. Login required for full check."
    ;;
  503)
    echo "result=assistant_disabled_or_not_configured"
    echo "hint=Set CRONO_ASSISTANT_ENABLED=true and OPENCLAW_GATEWAY_TOKEN in apps/web/.env.local"
    ;;
  502)
    echo "result=gateway_reachable_but_error"
    echo "hint=Verify OPENCLAW_GATEWAY_URL and gateway availability"
    ;;
  *)
    echo "result=unexpected_status"
    exit 1
    ;;
esac
