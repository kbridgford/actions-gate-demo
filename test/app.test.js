const request = require('supertest');
const { app, server } = require('../app');

describe('App Tests', () => {
  afterAll(() => {
    server.close();
  });

  test('GET / returns app info', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.body.message).toBe('GitHub Actions Security Gates Demo');
    expect(response.body.status).toBe('running');
  });

  test('GET /health returns health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
    expect(response.body.timestamp).toBeDefined();
  });

  test('GET /api/users returns user list', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test('POST /api/login with credentials returns token', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ username: 'test', password: 'test' })
      .expect(200);
    
    expect(response.body.token).toBeDefined();
    expect(response.body.message).toBe('Login successful');
  });

  test('POST /api/login without credentials returns error', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({})
      .expect(400);
    
    expect(response.body.error).toBe('Missing credentials');
  });
});