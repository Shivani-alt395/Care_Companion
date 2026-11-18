import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import path from 'path';
import 'express-async-errors';

import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import { globalRateLimit } from './middleware/rateLimiter';

// Routes
import authRoutes from './routes/auth';
import careLinksRoutes from './routes/careLinks';
import medicationsRoutes from './routes/medications';
import dosesRoutes from './routes/doses';
import vitalsRoutes from './routes/vitals';
import checkInRoutes from './routes/checkIn';
import appointmentsRoutes from './routes/appointments';
import sideEffectsRoutes from './routes/sideEffects';
import emergencyRoutes from './routes/emergency';
import reportsRoutes from './routes/reports';
import caregiverRoutes from './routes/caregiver';
import interactionsRoutes from './routes/interactions';
import gamesRoutes from './routes/games';
import pushRoutes from './routes/push';
import accountRoutes from './routes/account';
import healthRoutes from './routes/health';

// Swagger
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './utils/swagger';

export function createApp(): Application {
  const app = express();

  // Trust proxy for accurate IP in rate limiting / logs
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`Origin ${origin} not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_, res) => (res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
    })
  );

  // Global rate limit
  app.use('/api', globalRateLimit);

  // API routes
  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/care-links', careLinksRoutes);
  app.use('/api/v1/medications', medicationsRoutes);
  app.use('/api/v1/doses', dosesRoutes);
  app.use('/api/v1/vitals', vitalsRoutes);
  app.use('/api/v1/checkin', checkInRoutes);
  app.use('/api/v1/appointments', appointmentsRoutes);
  app.use('/api/v1/side-effects', sideEffectsRoutes);
  app.use('/api/v1/emergency', emergencyRoutes);
  app.use('/api/v1/reports', reportsRoutes);
  app.use('/api/v1/caregiver', caregiverRoutes);
  app.use('/api/v1/interactions', interactionsRoutes);
  app.use('/api/v1/games', gamesRoutes);
  app.use('/api/v1/push', pushRoutes);
  app.use('/api/v1/account', accountRoutes);

  // Swagger docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Serve React client in production
  if (env.NODE_ENV === 'production') {
    const clientPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientPath, { maxAge: '1d' }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(clientPath, 'index.html'));
    });
  }

  // Centralized error handler
  app.use(errorHandler);

  return app;
}
