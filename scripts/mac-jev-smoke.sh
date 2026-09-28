#!/usr/bin/env bash
# Run from the repository root on Ivan's Mac. No secret is persisted.
set -euo pipefail

if [ "$#" -gt 1 ] || { [ "$#" -eq 1 ] && [ "$1" != "--stay" ]; }; then
  printf 'Usage: bash scripts/mac-jev-smoke.sh [--stay]\n' >&2
  exit 2
fi

if ! command -v node >/dev/null || ! command -v curl >/dev/null; then
  printf 'Node.js 22+ and curl are required.\n' >&2
  exit 1
fi

if command -v lsof >/dev/null && lsof -nP -iTCP:4310 -sTCP:LISTEN >/dev/null 2>&1; then
  printf 'Port 4310 is in use. Stop the existing service before running this smoke test.\n' >&2
  exit 1
fi

printf 'TypeSafe API key (hidden; not saved): '
IFS= read -r -s TYPESAFE_API_KEY
printf '\n'
if [ -z "$TYPESAFE_API_KEY" ]; then
  printf 'No key supplied.\n' >&2
  exit 1
fi
export TYPESAFE_API_KEY
export JEV_PROVIDER=jev
export HOST=127.0.0.1
export PORT=4310

node services/jev-gateway/src/server.js >/dev/null 2>&1 &
gateway_pid=$!
cleanup() {
  kill "$gateway_pid" 2>/dev/null || true
  wait "$gateway_pid" 2>/dev/null || true
  unset TYPESAFE_API_KEY
}
trap cleanup EXIT
trap 'exit 130' INT TERM

attempt=0
until curl -fsS http://127.0.0.1:4310/health >/dev/null 2>&1; do
  attempt=$((attempt+1))
  if [ "$attempt" -ge 20 ]; then
    printf 'Gateway did not start. Check Node.js version and repository files.\n' >&2
    exit 1
  fi
  sleep 0.2
done

printf 'Live Jev routing response for a synthetic request:\n'
curl -fsS -i --max-time 25 -X POST http://127.0.0.1:4310/v1/route \
  -H 'content-type: application/json' \
  -d '{"text":"Write a test for a Node.js function in my project"}'
printf '\n'

if [ "${1:-}" = "--stay" ]; then
  printf 'Jev Gateway is running at http://127.0.0.1:4310. Test OpenClaw in another terminal; press Ctrl+C here to stop.\n'
  wait "$gateway_pid"
fi
