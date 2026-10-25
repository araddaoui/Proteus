import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppError, errorHandler, notFound } from './errors.js';

function testApp() {
  const app = express();
  app.get('/validation', () => {
    z.object({ name: z.string() }).parse({});
  });
  app.get('/expected', () => {
    throw new AppError(409, 'VERSION_CONFLICT', 'The decision changed.');
  });
  app.get('/crash', () => {
    throw new Error('secret database detail');
  });
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

describe('error envelope', () => {
  it('maps schema failures to 400 with issues', async () => {
    const response = await request(testApp()).get('/validation');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.length).toBeGreaterThan(0);
  });

  it('preserves expected application errors', async () => {
    const response = await request(testApp()).get('/expected');
    expect(response.status).toBe(409);
    expect(response.body.error).toMatchObject({ code: 'VERSION_CONFLICT', message: 'The decision changed.' });
  });

  it('hides internal error details', async () => {
    const response = await request(testApp()).get('/crash');
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.body.error.message).toBe('An unexpected error occurred.');
    expect(JSON.stringify(response.body)).not.toContain('secret database detail');
  });
});
