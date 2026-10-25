import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
  process.env.DATABASE_URL = 'postgresql://user:pass@127.0.0.1:1/none';
  process.env.DATABASE_SSL = 'false';
  process.env.NODE_ENV = 'test';
  const { createApp } = await import('./app.js');
  app = createApp();
});

describe('API shell', () => {
  it('serves runtime configuration', async () => {
    const response = await request(app).get('/api/v1/config');
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ aiEnabled: false, demoMode: false });
  });

  it('serves the versioned compass kernel', async () => {
    const response = await request(app).get('/api/v1/kernel');
    expect(response.status).toBe(200);
    expect(response.body.data.kernel.version).toBeTruthy();
  });

  it('requires a bearer token on authenticated routes', async () => {
    const response = await request(app).get('/api/v1/me');
    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(response.body.requestId).toBeTruthy();
  });

  it('returns the structured error envelope for unknown routes', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
