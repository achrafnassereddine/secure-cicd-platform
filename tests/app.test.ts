import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, closeDb } from '../src/app.js';

describe('secure application controls', () => {
  afterAll(() => closeDb());

  it('returns health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('requires authentication for documents', async () => {
    const response = await request(app).get('/api/documents/101');
    expect(response.status).toBe(401);
  });

  it('enforces object-level authorization', async () => {
    const login = await request(app).post('/api/login').send({ username: 'bob', password: 'demo-only-hash-bob' });
    expect(login.status).toBe(200);
    const response = await request(app).get('/api/documents/101').set('Authorization', `Bearer ${login.body.token}`);
    expect(response.status).toBe(404);
  });

  it('rejects admin endpoint for regular users', async () => {
    const login = await request(app).post('/api/login').send({ username: 'alice', password: 'demo-only-hash-alice' });
    const response = await request(app).get('/api/admin/audit').set('Authorization', `Bearer ${login.body.token}`);
    expect(response.status).toBe(403);
  });
});
