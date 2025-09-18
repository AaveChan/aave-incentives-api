import request from 'supertest';

import app from './app';

describe('Test app.ts', () => {
  test('Is alive route', async () => {
    const res = await request(app).get('/');
    expect(res.body).toEqual({ message: "Miley, what's good?" });
  });
});
