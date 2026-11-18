import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../app';

const app = createApp();
const request = supertest(app);

describe('Auth API', () => {
  const email = `test_${Date.now()}@test.com`;
  let accessToken: string;

  it('POST /api/v1/auth/register - registers a new senior', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email,
      password: 'TestPass@123',
      role: 'SENIOR',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe('SENIOR');
    accessToken = res.body.accessToken;
  });

  it('POST /api/v1/auth/register - rejects duplicate email', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email,
      password: 'AnotherPass@123',
      role: 'SENIOR',
      firstName: 'Another',
      lastName: 'User',
    });
    expect(res.status).toBe(409);
  });

  it('POST /api/v1/auth/login - logs in successfully', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      email,
      password: 'TestPass@123',
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    accessToken = res.body.accessToken;
  });

  it('POST /api/v1/auth/login - rejects wrong password', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      email,
      password: 'WrongPass@123',
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me - returns user with valid token', async () => {
    const res = await request
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it('GET /api/v1/auth/me - rejects invalid token', async () => {
    const res = await request
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});

describe('Authorization - IDOR prevention', () => {
  let seniorToken: string;
  let caregiverToken: string;
  let seniorId: string;

  beforeAll(async () => {
    const ts = Date.now();
    // Register senior
    const sr = await request.post('/api/v1/auth/register').send({
      email: `senior_${ts}@test.com`,
      password: 'Pass@1234',
      role: 'SENIOR',
      firstName: 'Senior',
      lastName: 'Test',
    });
    seniorToken = sr.body.accessToken;
    seniorId = sr.body.user.id;

    // Register caregiver
    const cr = await request.post('/api/v1/auth/register').send({
      email: `cg_${ts}@test.com`,
      password: 'Pass@1234',
      role: 'CAREGIVER',
      firstName: 'Caregiver',
      lastName: 'Test',
    });
    caregiverToken = cr.body.accessToken;
  });

  it('Caregiver cannot access unlinked senior dashboard', async () => {
    const res = await request
      .get(`/api/v1/caregiver/seniors/${seniorId}/dashboard`)
      .set('Authorization', `Bearer ${caregiverToken}`);
    expect(res.status).toBe(403);
  });

  it('Senior cannot access caregiver-only endpoints', async () => {
    const res = await request
      .get('/api/v1/caregiver/seniors')
      .set('Authorization', `Bearer ${seniorToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Interactions checker', () => {
  it('GET /api/v1/interactions/check - detects aspirin+warfarin interaction', async () => {
    const res = await request.get('/api/v1/interactions/check?medicines=aspirin,warfarin');
    expect(res.status).toBe(200);
    expect(res.body.warnings).toBeInstanceOf(Array);
    const redWarning = res.body.warnings.find(
      (w: { severity: string }) => w.severity === 'red'
    );
    expect(redWarning).toBeTruthy();
  });

  it('GET /api/v1/interactions/check - returns no warnings for safe combo', async () => {
    const res = await request.get('/api/v1/interactions/check?medicines=amoxicillin');
    expect(res.status).toBe(200);
    expect(res.body.warnings).toBeInstanceOf(Array);
  });
});

describe('Health endpoints', () => {
  it('GET /api/v1/health - returns ok', async () => {
    const res = await request.get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
