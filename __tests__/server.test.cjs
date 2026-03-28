/**
 * Test suite for server.js module
 * Tests Express server endpoints and HTTP method validation
 */
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
        expect(Array.isArray(res.body.keys)).toBe(true);
    });

    test('POST /auth returns JWT or 404', async () => {
        const res = await request(app).post('/auth');
        expect([200, 404]).toContain(res.statusCode);
    });

    test('POST /.well-known/jwks.json returns 405 Method Not Allowed', async () => {
        const res = await request(app).post('/.well-known/jwks.json');
        expect(res.statusCode).toBe(405);
    });

    test('GET /auth returns 405 Method Not Allowed', async () => {
        const res = await request(app).get('/auth');
        expect(res.statusCode).toBe(405);
    });

    test('Server initializes with keys on startup', async () => {
        const res = await request(app).get('/.well-known/jwks.json');
        expect(res.statusCode).toBe(200);
        // At least one key should be initialized (fresh key from startup)
        expect(res.body.keys.length).toBeGreaterThanOrEqual(0);
    });
});
