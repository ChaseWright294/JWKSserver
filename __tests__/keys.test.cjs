const { generateKeyPair, getFreshKey, getAllFreshKeys, getExpiredKey, getAllExpiredKeys, getKeyWithKid, keys } = require('../keys');

describe('keys.js', () => {
    beforeEach(() => {
        // Clear keys array before each test
        keys.length = 0;
    });

    test('generateKeyPair creates a fresh key', async () => {
        const key = await generateKeyPair(false);
        expect(key).toHaveProperty('kid');
        expect(key).toHaveProperty('publicKey');
        expect(key).toHaveProperty('privateKey');
        expect(key.expireTime).toBeGreaterThan(Date.now());
        expect(keys.length).toBe(1);
    });

    test('generateKeyPair creates an expired key', async () => {
        const key = await generateKeyPair(true);
        expect(key.expireTime).toBeLessThan(Date.now());
    });

    test('getFreshKey returns only fresh keys', async () => {
        await generateKeyPair(false);
        await generateKeyPair(true);
        const fresh = getFreshKey();
        expect(fresh.expireTime).toBeGreaterThan(Date.now());
    });

    test('getExpiredKey returns only expired keys', async () => {
        await generateKeyPair(false);
        await generateKeyPair(true);
        const expired = getExpiredKey();
        expect(expired.expireTime).toBeLessThanOrEqual(Date.now());
    });

    test('getKeyWithKid returns correct key', async () => {
        const key = await generateKeyPair(false);
        const found = getKeyWithKid(key.kid);
        expect(found).toBe(key);
    });
});
