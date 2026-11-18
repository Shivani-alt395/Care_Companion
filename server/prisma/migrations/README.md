# Prisma Migrations

Migrations are auto-generated from `schema.prisma` using:

```bash
# Development: creates a new migration
npx prisma migrate dev --name init

# Production: runs pending migrations
npx prisma migrate deploy
```

The Docker container automatically runs `prisma migrate deploy` on startup via `docker-entrypoint.sh`.

## First Time Setup

```bash
cd server
npx prisma migrate dev --name init
npm run seed
```
