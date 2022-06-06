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

  describe('Cache Release Lock ' + keySuffix, function() {
    it('should return promise', async function() {
      let cKey = 'cache-key-rl' + keySuffix,
        response = cacheObj.releaseLock(cKey);
      assert.typeOf(response, 'Promise');
    });

    it('should fail when key is not passed', async function() {
      let response = await cacheObj.releaseLock();
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is undefined', async function() {
      let response = await cacheObj.releaseLock(undefined);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is blank', async function() {
      let cKey = '',
        response = await cacheObj.releaseLock(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is number', async function() {
      let cKey = 10,
        response = await cacheObj.releaseLock(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key has space', async function() {
      let cKey = 'a b' + keySuffix,
        response = await cacheObj.releaseLock(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key length is > 250 bytes', async function() {
      let cKey = Array(252).join('x'),
        response = await cacheObj.releaseLock(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should be able to reacquire lock after releasing', async function() {
      let cKey = 'cache-key-rel' + keySuffix,
        ttl = defaultTtl,
        response;

      // acquireLock
      response = await cacheObj.acquireLock(cKey, ttl);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, true);

      // releaseLock
      response = await cacheObj.releaseLock(cKey);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, true);

      // retry to acquire lock after it was released
      response = await cacheObj.acquireLock(cKey, ttl);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, true);
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
        response1 = await cacheObj1.releaseLock(cKey1, ttl),
        cKey2 = 'cache-key-mll2' + keySuffix,
        response2 = await cacheObj2.releaseLock(cKey2, ttl);
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
