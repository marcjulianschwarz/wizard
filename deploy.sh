#!/bin/bash
set -euo pipefail

SSH_HOST="deploy"
REMOTE_DIR="/home/deploy/projects/production-wizard"


echo "🚀 Deploying wizard to production..."

# Wait for the GHCR image build (Publish Docker Images workflow) for the
# current commit to finish, so we never deploy a stale :latest. Skip with
# SKIP_WAIT=1 (e.g. deploying an already-built commit).
WORKFLOW="Publish Docker Images"
if [[ "${SKIP_WAIT:-0}" != "1" ]]; then
  SHA="$(git rev-parse HEAD)"
  echo "⏳ Waiting for '$WORKFLOW' build of ${SHA:0:7}..."

  # The run can take a few seconds to register after a push; poll for its id.
  RUN_ID=""
  for _ in $(seq 1 30); do
    RUN_ID="$(gh run list --workflow "$WORKFLOW" --commit "$SHA" \
      --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)"
    [[ -n "$RUN_ID" ]] && break
    sleep 2
  done

  if [[ -z "$RUN_ID" ]]; then
    echo "❌ No '$WORKFLOW' run found for ${SHA:0:7}. Did you push this commit?"
    echo "   (Deploy an already-built commit with SKIP_WAIT=1 ./deploy.sh)"
    exit 1
  fi

  # --exit-status makes a failed/cancelled build abort the deploy (set -e).
  gh run watch "$RUN_ID" --exit-status
fi

echo "📁 Ensuring deployment directory..."
ssh "$SSH_HOST" "mkdir -p $REMOTE_DIR"

echo "📦 Copying docker-compose.prod.yml..."
rsync -az docker-compose.prod.yml "$SSH_HOST:$REMOTE_DIR/docker-compose.yml"

echo "🔐 Copying .env..."
rsync -az .env.prod "$SSH_HOST:$REMOTE_DIR/.env"
ssh "$SSH_HOST" "chmod 600 $REMOTE_DIR/.env"

echo "⬇️  Pulling images and starting services..."
# --force-recreate so containers swap even when the image ref didn't change
# (e.g. :latest moved to a new digest), replacing any old locally-built ones.
ssh "$SSH_HOST" "cd $REMOTE_DIR && docker compose pull && docker compose up -d --force-recreate --remove-orphans"

echo "🔎 Verifying deployed images..."
ssh "$SSH_HOST" "cd $REMOTE_DIR && docker compose images && docker compose ps"

echo "✨ Done!"

# Attach to both container logs after starting. Skip with SKIP_LOGS=1.
if [[ "${SKIP_LOGS:-0}" != "1" ]]; then
  echo "📜 Attaching to logs (Ctrl-C / q to quit)..."
  make logs
fi
