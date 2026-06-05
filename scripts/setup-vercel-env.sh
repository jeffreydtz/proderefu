#!/usr/bin/env bash
# Push every KEY=VALUE in .env.vercel to the Vercel project's environments.
# Idempotent: removes an existing var before re-adding it.
#
# Prereqs:
#   1. npx vercel login        (one-time, interactive)
#   2. npx vercel link --yes   (links this dir to the project)
#   3. a .env.vercel file (gitignored) with KEY=VALUE lines
#
# Usage: bash scripts/setup-vercel-env.sh
set -euo pipefail

ENV_FILE="${1:-.env.vercel}"
ENVIRONMENTS=("${VERCEL_ENVS:-production}")
VERCEL="npx --yes vercel"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ $ENV_FILE not found. Create it with KEY=VALUE lines." >&2
  exit 1
fi

while IFS= read -r line || [[ -n "$line" ]]; do
  # skip blanks and comments
  [[ -z "${line// }" ]] && continue
  [[ "$line" == \#* ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  # strip optional surrounding quotes
  value="${value%\"}"; value="${value#\"}"
  [[ -z "$key" ]] && continue
  for env in "${ENVIRONMENTS[@]}"; do
    $VERCEL env rm "$key" "$env" --yes >/dev/null 2>&1 || true
    printf '%s' "$value" | $VERCEL env add "$key" "$env" >/dev/null 2>&1 \
      && echo "✓ set $key ($env)" \
      || echo "✗ failed $key ($env)" >&2
  done
done < "$ENV_FILE"

echo "Done. Deploy with: npx vercel --prod"
