import request from 'supertest';
import app from '../app';

describe('User routes', () => {
  test('Get all users', async () => {
    const res = await request(app).get('/users');
    expect(res.body).toEqual(['Nicki', 'Ariana', 'Lana', 'Miley']);
  });
});
