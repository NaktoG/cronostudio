# Runbook: OpenClaw "Crono" Operations and Security

## Scope

This runbook covers operational recovery and security hardening for OpenClaw when used as the Crono orchestrator.

## Symptoms

- Telegram replies fail with: `OAuth token refresh failed for openai-codex`
- Logs include: `refresh_token_reused`
- `openclaw models status --json` shows expired OAuth profile (`remainingMs < 0`)

## 1) Verify current status

```bash
docker exec openclaw-openclaw-gateway-1 openclaw status --json
docker exec openclaw-openclaw-gateway-1 openclaw models status --json
docker exec openclaw-openclaw-gateway-1 openclaw secrets audit --json
```

Expected:
- `defaultModel` present and agent `main` enabled
- OAuth profile exists for `openai-codex`
- `secrets audit` findings are visible before remediation

## 2) Re-authenticate openai-codex (interactive)

`openclaw models auth login` requires a TTY. Run this directly on VPS shell:

```bash
docker exec -it openclaw-openclaw-gateway-1 openclaw models auth login --provider openai-codex
```

Then verify:

```bash
docker exec openclaw-openclaw-gateway-1 openclaw models status --json
docker logs --tail 200 openclaw-openclaw-gateway-1
```

Expected:
- no new `refresh_token_reused`
- model requests succeed from Telegram / Control UI

## 3) Keep assistant identity as Crono

Check identity metadata:

```bash
python3 - <<'PY'
import json
from pathlib import Path
obj=json.loads(Path('/home/nakto/.openclaw/openclaw.json').read_text())
agent=(obj.get('agents',{}).get('list') or [])[0]
print(agent.get('identity',{}))
PY
```

Expected `name` value: `Crono`.

## 4) Secret hygiene (required)

Current known plaintext findings usually include:
- `channels.telegram.botToken`
- `messages.tts.openai.apiKey`

Use SecretRef migration flow:

```bash
docker exec -it openclaw-openclaw-gateway-1 openclaw secrets configure
docker exec openclaw-openclaw-gateway-1 openclaw secrets audit --check
```

Notes:
- `secrets configure` is interactive by design.
- For non-interactive apply, generate a plan JSON and run `openclaw secrets apply --from <plan>`.

## 5) Restart and post-checks

```bash
docker restart openclaw-openclaw-gateway-1
docker exec openclaw-openclaw-gateway-1 openclaw status --json
docker logs --tail 200 openclaw-openclaw-gateway-1
```

Pass criteria:
- gateway healthy
- no auth refresh errors
- `secrets audit --check` exits 0

## Incident notes

- `commands.ownerDisplay` is not a custom assistant name field; valid values are only `raw` or `hash`.
- Assistant naming should be done in `agents.list[].identity.name`.
