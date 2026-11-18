import 'dotenv/config';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { startJobs } from './jobs';

async function bootstrap() {
  // Verify DB connection
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (err) {
    logger.error({ err }, '❌ Database connection failed');
    process.exit(1);
  }

  // Auto-seed in development or when SEED_ON_START is set
  if (env.SEED_ON_START === 'true' || env.NODE_ENV === 'development') {
    try {
      const { execSync } = await import('child_process');
      execSync('npx tsx prisma/seed.ts', { cwd: process.cwd(), stdio: 'inherit' });
      logger.info('✅ Database seeded');
    } catch (_err) {
      logger.warn('⚠️  Seed skipped (may already be seeded)');
    }
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 CareCompanion running at http://localhost:${env.PORT}`);
    logger.info(`📚 API docs at http://localhost:${env.PORT}/api/docs`);
  });

  // Start background jobs
  startJobs();
  logger.info('⏰ Background jobs started');

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received – shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after 10s');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
