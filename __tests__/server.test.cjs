const request = require('supertest');
const app = require('../server');
const { keys } = require('../keys');

describe('server.js', () => {
    beforeEach(() => {
        keys.length = 0;
    });

    test('GET / returns server running message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.text).toMatch(/JWKS server running/);
    });

    test('GET /.well-known/jwks.json returns JWKS', async () => {
        const res = await request(app).get('/.well-known/jwks.json');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('keys');
    });

    test('POST /auth returns JWT or 404', async () => {
        const res = await request(app).post('/auth');
        expect([200, 404]).toContain(res.statusCode);
    });
});
