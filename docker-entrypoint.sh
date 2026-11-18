#!/bin/sh
set -e

echo "Running Prisma migrations..."
cd /app/server
npx prisma migrate deploy

echo "Starting CareCompanion server..."
exec node dist/index.js
