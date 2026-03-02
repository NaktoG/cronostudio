#!/bin/sh
set -eu

ROOT_JSON_REGEX='^[A-Za-z0-9_-]{20,}\.json$'

staged_files=$(git diff --cached --name-only --diff-filter=ACM || true)
if [ -z "$staged_files" ]; then
  exit 0
fi

violations=""
for file in $staged_files; do
  case "$file" in
    */*)
      continue
      ;;
  esac

  case "$file" in
    .lintstagedrc.json)
      continue
      ;;
    *.json)
      if echo "$file" | grep -Eq "$ROOT_JSON_REGEX"; then
        violations="$violations\n$file"
      fi
      ;;
  esac
done

if [ -n "$violations" ]; then
  printf "\n[guardrail] Found JSON files in repo root that look like workflow exports (pattern: %s):%b\n" "$ROOT_JSON_REGEX" "$violations"
  printf "Move them to n8n/workflows/_exports/ or rename to a human-friendly filename.\n"
  exit 1
fi
