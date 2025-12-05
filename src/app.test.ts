import request from 'supertest';
import { describe, expect, test } from 'vitest';

import app from './app.js';

describe('Test app.ts', () => {
  test('ping', async () => {
    const res = await request(app).get('/ping');
    expect(res.body).toEqual({ message: 'pong' });
  });
});
