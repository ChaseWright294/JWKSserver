const request = require('supertest');
const express = require('express');
const { generateKeyPair, keys } = require('../keys');
const { jwksManager, getKeyByKid } = require('../jwks');

describe('jwks.js', () => {
    let app;
    beforeEach(() => {
        app = express();
        app.get('/.well-known/jwks.json', jwksManager);
        app.get('/.well-known/jwks.json/:kid', getKeyByKid);
        keys.length = 0;
    });

    test('GET /.well-known/jwks.json returns fresh keys', async () => {
        await generateKeyPair(false);
        const res = await request(app).get('/.well-known/jwks.json');
        expect(res.statusCode).toBe(200);
        expect(res.body.keys).toBeInstanceOf(Array);
        expect(res.body.keys.length).toBeGreaterThan(0);
    });

    test('GET /.well-known/jwks.json/:kid returns specific key', async () => {
        const key = await generateKeyPair(false);
        const res = await request(app).get(`/.well-known/jwks.json/${key.kid}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.kid).toBe(key.kid);
    });

    test('GET /.well-known/jwks.json/:kid returns 404 for missing key', async () => {
        const res = await request(app).get('/.well-known/jwks.json/doesnotexist');
        expect(res.statusCode).toBe(404);
    });
});
