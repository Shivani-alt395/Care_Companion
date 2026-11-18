// Test setup - set env before anything else
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://carecompanion:carecompanion@localhost:5432/carecompanion_test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';
process.env.MISSED_DOSE_GRACE_MINUTES = '120';
process.env.INVITE_CODE_EXPIRY_HOURS = '24';
process.env.LOG_LEVEL = 'silent';
