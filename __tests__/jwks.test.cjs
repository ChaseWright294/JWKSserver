/**
 * Test suite for jwks.js module
 * Tests JWKS endpoint and key formatting
 */
const request = require('supertest');
const express = require('express');
const { generateKeyPair, keys } = require('../keys');
const { jwksManager } = require('../jwks');

describe('jwks.js', () => {
    let app;
    beforeEach(() => {
        app = express();
        app.get('/.well-known/jwks.json', jwksManager);
        keys.length = 0;
    });

    test('GET /.well-known/jwks.json returns fresh keys only', async () => {
        await generateKeyPair(false);
        await generateKeyPair(true);
        const res = await request(app).get('/.well-known/jwks.json');
        expect(res.statusCode).toBe(200);
        expect(res.body.keys).toBeInstanceOf(Array);
        expect(res.body.keys.length).toBe(1);
    });

    test('JWKS response contains required properties', async () => {
        await generateKeyPair(false);
        const res = await request(app).get('/.well-known/jwks.json');
        expect(res.statusCode).toBe(200);
        expect(res.body.keys[0]).toHaveProperty('kty');
        expect(res.body.keys[0]).toHaveProperty('n');
        expect(res.body.keys[0]).toHaveProperty('e');
        expect(res.body.keys[0]).toHaveProperty('kid');
        expect(res.body.keys[0]).toHaveProperty('use');
        expect(res.body.keys[0]).toHaveProperty('alg');
    });

    test('JWKS endpoint returns RSA keys with correct algorithm', async () => {
        await generateKeyPair(false);
        const res = await request(app).get('/.well-known/jwks.json');
        expect(res.statusCode).toBe(200);
        expect(res.body.keys[0].kty).toBe('RSA');
        expect(res.body.keys[0].alg).toBe('RS256');
        expect(res.body.keys[0].use).toBe('sig');
    });

    test('GET /.well-known/jwks.json returns empty array when no fresh keys', async () => {
        await generateKeyPair(true);
        const res = await request(app).get('/.well-known/jwks.json');
        expect(res.statusCode).toBe(200);
        expect(res.body.keys).toBeInstanceOf(Array);
        expect(res.body.keys.length).toBe(0);
    });
});
