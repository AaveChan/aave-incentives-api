import request from 'supertest';
import { describe, expect, test } from 'vitest';

import app from './app.js';

describe('Test app.ts', () => {
  test('Is alive route', async () => {
    const res = await request(app).get('/');
    expect(res.body).toEqual({ message: "Miley, what's good?" });
  });
});
