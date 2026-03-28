/**
 * Test suite for auth.js module
 * Tests JWT token generation with proper error handling
 */
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
        expect(res.body.error).toBe('No valid key found');
    });

    test('generated token has RS256 algorithm', async () => {
        await generateKeyPair(false);
        const res = await request(app).post('/auth');
        expect(res.statusCode).toBe(200);
        const parts = res.body.token.split('.');
        expect(parts.length).toBe(3);
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
        expect(header.alg).toBe('RS256');
    });

    test('uses getFreshKey when expired parameter is not true', async () => {
        await generateKeyPair(false);
        await generateKeyPair(true);
        const res = await request(app).post('/auth?expired=false');
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
        const parts = res.body.token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        // Fresh key should have exp in the future
        expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    test('response includes token property on success', async () => {
        await generateKeyPair(false);
        const res = await request(app).post('/auth');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(typeof res.body.token).toBe('string');
        expect(res.body.token.split('.').length).toBe(3);
    });

    test('generated token payload includes required claims', async () => {
        await generateKeyPair(false);
        const res = await request(app).post('/auth');
        expect(res.statusCode).toBe(200);
        const parts = res.body.token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        expect(payload).toHaveProperty('sub', 'cool_username');
        expect(payload).toHaveProperty('name', 'Cool User');
        expect(payload).toHaveProperty('iat');
    });

    test('expired token payload has exp claim in the past', async () => {
        await generateKeyPair(true);
        const res = await request(app).post('/auth?expired=true');
        expect(res.statusCode).toBe(200);
        const parts = res.body.token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        expect(payload).toHaveProperty('exp');
        // Expired token should have exp in the past
        expect(payload.exp).toBeLessThan(Math.floor(Date.now() / 1000));
    });
});
