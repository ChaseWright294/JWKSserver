const request = require('supertest');
const express = require('express');
const { authManager } = require('../auth');
const { generateKeyPair, keys } = require('../keys');

describe('auth.js', () => {
    let app;
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.post('/auth', authManager);
        keys.length = 0;
    });

    test('returns JWT for fresh key', async () => {
        await generateKeyPair(false);
        const res = await request(app).post('/auth');
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    test('returns JWT for expired key when requested', async () => {
        await generateKeyPair(true);
        const res = await request(app).post('/auth?expired=true');
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    test('returns 404 if no key available', async () => {
        const res = await request(app).post('/auth');
        expect(res.statusCode).toBe(404);
    });
});
