// Load external packages
const chai = require('chai'),
  assert = chai.assert;

// Load cache service
const rootPrefix = '..',
  Cache = require(rootPrefix + '/index'),
  testCachingEngine = process.env.TEST_CACHING_ENGINE;

let configStrategy1;
let configStrategy2;
if (testCachingEngine === 'redis') {
  configStrategy1 = require(rootPrefix + '/test/env/redis.json');
  configStrategy2 = require(rootPrefix + '/test/env/redis2.json');
} else if (testCachingEngine === 'memcached') {
  configStrategy1 = require(rootPrefix + '/test/env/memcached.json');
  configStrategy2 = require(rootPrefix + '/test/env/memcached2.json');
} else if (testCachingEngine === 'none') {
  configStrategy1 = require(rootPrefix + '/test/env/inMemory.json');
  configStrategy2 = require(rootPrefix + '/test/env/inMemory2.json');
}

let defaultTtl = 1000; // in seconds

function performTest(cacheObj) {
  let keySuffix = '_' + new Date().getTime();

  describe('Cache Acquire Lock ' + keySuffix, function() {
    it('should return promise', async function() {
      let cKey = 'cache-key-rp' + keySuffix,
        ttl = defaultTtl,
        response = cacheObj.acquireLock(cKey, ttl);
      assert.typeOf(response, 'Promise');
    });

    it('should return response true', async function() {
      let cKey = 'cache-key-rpt' + keySuffix,
        response = await cacheObj.acquireLock(cKey, defaultTtl);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, true);
    });

    it('should fail when key is not passed', async function() {
      let response = await cacheObj.acquireLock();
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is undefined', async function() {
      let ttl = defaultTtl,
        response = await cacheObj.acquireLock(undefined, ttl);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is blank', async function() {
      let cKey = '',
        ttl = defaultTtl,
        response = await cacheObj.acquireLock(cKey, ttl);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is number', async function() {
      let cKey = 10,
        ttl = defaultTtl,
        response = await cacheObj.acquireLock(cKey, ttl);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key has space', async function() {
      let cKey = 'a b' + keySuffix,
        ttl = defaultTtl,
        response = await cacheObj.acquireLock(cKey, ttl);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key length is > 250 bytes', async function() {
      let cKey = Array(252).join('x'),
        ttl = defaultTtl,
        response = await cacheObj.acquireLock(cKey, ttl);
      assert.equal(response.isSuccess(), false);
    });

    it('should auto release lock after ttl', async function() {
      let cKey = 'cache-key-arl' + keySuffix,
        ttl = 6, // seconds
        response = await cacheObj.acquireLock(cKey, ttl);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, true);
      setTimeout(async function() {
        response = await cacheObj.acquireLock(cKey, ttl);
        assert.equal(response.isSuccess(), true);
        assert.equal(response.data.response, true);
      }, ttl * 1000);
    });

    it('should not be able to require lock before ttl', async function() {
      // acquire lock
      let cKey = 'cache-key-brl' + keySuffix,
        ttl = 6, // seconds
        response = await cacheObj.acquireLock(cKey, ttl);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, true);

      // retry to acquire lock before ttl. should fail
      response = await cacheObj.acquireLock(cKey, ttl);
      assert.equal(response.isSuccess(), false);
    });

    it('should not be able to acquire lock for wrong ttl', async function() {
      let cKey = 'cache-key-brl' + keySuffix,
        ttl = 6.5, // seconds
        response = await cacheObj.acquireLock(cKey, ttl);
      assert.equal(response.isSuccess(), false);
    });

    it('should not be able to acquire lock if ttl is string', async function() {
      let cKey = 'cache-key-brl' + keySuffix,
        ttl = 'string', // seconds
        response = await cacheObj.acquireLock(cKey, ttl);
      assert.equal(response.isSuccess(), false);
    });
  });
}

function performMultipleTest(cacheObj1, cacheObj2) {
  let keySuffix = '_' + new Date().getTime();

  describe('Cache Acquire Lock Across Multiple Cache Instances ' + keySuffix, function() {
    keySuffix = keySuffix + '_' + new Date().getTime();

    it('should be able to reacquire lock on other cache instance even before ttl', async function() {
      let cKey1 = 'cache-key-mll1' + keySuffix,
        ttl = 6, // seconds
        response1 = await cacheObj1.acquireLock(cKey1, ttl),
        cKey2 = 'cache-key-mll2' + keySuffix,
        response2 = await cacheObj2.acquireLock(cKey2, ttl);
      assert.equal(response1.isSuccess(), true);
      assert.equal(response1.data.response, true);
      assert.equal(response2.isSuccess(), true);
      assert.equal(response2.data.response, true);
    });
  });
}

cache1 = Cache.getInstance(configStrategy1);
cacheImplementer1 = cache1.cacheInstance;

cache2 = Cache.getInstance(configStrategy2);
cacheImplementer2 = cache2.cacheInstance;

performTest(cacheImplementer1);

performMultipleTest(cacheImplementer1, cacheImplementer2);
