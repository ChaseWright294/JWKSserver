/**
 * Test suite for keys.js module
 * Tests RSA key pair generation, storage, and retrieval
 */
const { generateKeyPair, getFreshKey, getAllFreshKeys, getExpiredKey, getAllExpiredKeys, getKeyWithKid, keys } = require('../keys');

describe('keys.js', () => {
    beforeEach(() => {
        // Clear keys array before each test
        keys.length = 0;
    });

    test('generateKeyPair creates a fresh key', async () => {
        const key = await generateKeyPair(false);
        expect(key).toHaveProperty('kid');
        expect(key).toHaveProperty('privateKey');
        expect(key).toHaveProperty('expireTime');
        expect(key.expireTime).toBeGreaterThan(Date.now());
        expect(keys.length).toBe(1);
    });

    test('generateKeyPair creates an expired key', async () => {
        const key = await generateKeyPair(true);
        expect(key.expireTime).toBeLessThan(Date.now());
    });

    test('generateKeyPair stores key in database', async () => {
        const key = await generateKeyPair(false);
        expect(typeof key.kid).toBe('number');
        expect(key.kid).toBeGreaterThan(0);
    });

    test('getFreshKey returns only fresh keys', async () => {
        await generateKeyPair(false);
        await generateKeyPair(true);
        const fresh = await getFreshKey();
        expect(fresh).not.toBeNull();
        expect(fresh.expireTime).toBeGreaterThan(Date.now());
    });

    test('getAllFreshKeys returns array of fresh keys', async () => {
        await generateKeyPair(false);
        await generateKeyPair(false);
        await generateKeyPair(true);
        const freshKeys = await getAllFreshKeys();
        expect(Array.isArray(freshKeys)).toBe(true);
        expect(freshKeys.length).toBe(2);
        freshKeys.forEach(key => {
            expect(key.expireTime).toBeGreaterThan(Date.now());
        });
    });

    test('getExpiredKey returns only expired keys', async () => {
        await generateKeyPair(false);
        await generateKeyPair(true);
        const expired = await getExpiredKey();
        expect(expired).not.toBeNull();
        expect(expired.expireTime).toBeLessThanOrEqual(Date.now());
    });

    test('getAllExpiredKeys returns array of expired keys', async () => {
        await generateKeyPair(false);
        await generateKeyPair(true);
        await generateKeyPair(true);
        const expiredKeys = await getAllExpiredKeys();
        expect(Array.isArray(expiredKeys)).toBe(true);
        expect(expiredKeys.length).toBe(2);
        expiredKeys.forEach(key => {
            expect(key.expireTime).toBeLessThanOrEqual(Date.now());
        });
    });

    test('getKeyWithKid returns correct key', async () => {
        const key = await generateKeyPair(false);
        const found = await getKeyWithKid(key.kid);
        expect(found).not.toBeNull();
        expect(found.kid).toBe(key.kid);
    });

    test('getKeyWithKid returns null for non-existent kid', async () => {
        const found = await getKeyWithKid(99999);
        expect(found).toBeNull();
    });
});
