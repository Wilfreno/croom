#!/usr/bin/env bash
# Runs ON THE VM, piped in over SSH by .github/workflows/deploy-server.yml:
#   ssh vm "bash -s -- <commit sha>" < scripts/deploy-server.sh
# Checks out that commit, rebuilds the server and restarts it under pm2.
# Expects the one-time setup from the workflow's header to be done.
set -euo pipefail

SHA="$1"
APP_DIR="$HOME/croom"
PM2_NAME="croom-server"

cd "$APP_DIR"

echo "==> Checking out $SHA"
git fetch --prune origin
git checkout --force "$SHA"

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

# The root preinstall hook also builds these, but pnpm skips it when the
# lockfile hasn't changed, which would leave the server compiling against
# stale package builds.
echo "==> Building the shared packages"
pnpm build:libs

echo "==> Building the server"
pnpm --filter nest-server build

echo "==> Restarting the server"
cd apps/server # the server reads .env from its working directory
if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  pm2 reload "$PM2_NAME" --update-env
else
  pm2 start dist/main.js --name "$PM2_NAME"
fi
pm2 save

echo "==> Deployed $SHA"
