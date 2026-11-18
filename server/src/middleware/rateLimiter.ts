import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { env } from '../config/env';

// In development, skip rate limiting for localhost so tests and demos don't get blocked
function skipLocalhost(req: Request): boolean {
  if (env.NODE_ENV !== 'production') {
    const ip = req.ip ?? req.socket.remoteAddress ?? '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  }
  return false;
}

export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocalhost,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
});

export const authRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipLocalhost,
  skipSuccessfulRequests: true,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts. Please wait before trying again.' } },
});
