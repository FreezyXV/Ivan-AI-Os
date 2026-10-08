#!/usr/bin/env bash
# Authenticated local smoke; secrets stay in the private runtime/hidden prompt.
set -euo pipefail
exec node scripts/mac-jev-runtime.mjs "$@"
