// Load external packages
const chai = require('chai'),
  assert = chai.assert;

// Load cache service
const rootPrefix = '..',
  Cache = require(rootPrefix + '/index'),
  testCachingEngine = process.env.TEST_CACHING_ENGINE;

let configStrategy;
let configStrategy3;
if (testCachingEngine === 'redis') {
  configStrategy = require(rootPrefix + '/test/env/redis.json');
  configStrategy3 = require(rootPrefix + '/test/env/redis3.json');
} else if (testCachingEngine === 'memcached') {
  configStrategy = require(rootPrefix + '/test/env/memcached.json');
  configStrategy3 = require(rootPrefix + '/test/env/memcached3.json');
} else if (testCachingEngine === 'none') {
  configStrategy = require(rootPrefix + '/test/env/inMemory.json');
}

const engineType = configStrategy.cache.engine;

function performTest(cacheObj, keySuffix) {
  describe('Cache Touch ' + keySuffix, function() {
    keySuffix = keySuffix + '_' + new Date().getTime();

    it('should return promise', async function() {
      let cKey = 'cache-key-touch' + keySuffix,
        cValue = 100,
        response = cacheObj.touch(cKey, cValue);
      assert.typeOf(response, 'Promise');
    });

    it('should fail when key/expiry is not passed', async function() {
      let response = await cacheObj.touch();
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is undefined', async function() {
      let cValue = 100,
        response = await cacheObj.touch(undefined, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is blank', async function() {
      let cKey = '',
        cValue = 100,
        response = await cacheObj.touch(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is number', async function() {
      let cKey = 10,
        cValue = 100,
        response = await cacheObj.touch(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key has space', async function() {
      let cKey = 'a b' + keySuffix,
        cValue = 100,
        response = await cacheObj.touch(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key length is > 250 bytes', async function() {
      let cKey = Array(252).join('x'),
        cValue = 100,
        response = await cacheObj.touch(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when expiry is Object', async function() {
      let cKey = 'cache-key-touch' + keySuffix,
        cValue = { a: 1 },
        response = await cacheObj.touch(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when expiry is blank', async function() {
      let cKey = 'cache-key-touch' + keySuffix,
        cValue = '',
        response = await cacheObj.touch(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when expiry is string', async function() {
      let cKey = 'cache-key-touch' + keySuffix,
        cValue = 'String Value',
        response = await cacheObj.touch(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key does not exist', async function() {
      let cKey = 'cache-key-touch-not-exist' + keySuffix,
        cValue = 100,
        response = await cacheObj.touch(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when expiry is negative secs', async function() {
      let cKey = 'cache-key-touch' + keySuffix,
        cValue = 'my value',
        response = await cacheObj.set(cKey, cValue);
      assert.equal(response.isSuccess(), true);

      // touch by negative value
      expiry = -1;
      resObj = await cacheObj.touch(cKey, expiry);
      assert.equal(resObj.isSuccess(), false);
    });

    it('should pass when expiry is 100 secs', async function() {
      let cKey = 'cache-key-touch' + keySuffix,
        cValue = 'my value',
        response = await cacheObj.set(cKey, cValue);
      assert.equal(response.isSuccess(), true);

      // touch by positive value
      expiry = 100;
      resObj = await cacheObj.touch(cKey, expiry);
      assert.equal(resObj.isSuccess(), true);
    });

    it('should pass when expiry is 0 secs', async function() {
      let cKey = 'cache-key-touch' + keySuffix,
        cValue = 'my value',
        response = await cacheObj.set(cKey, cValue);
      assert.equal(response.isSuccess(), true);

      // touch by 0 value
      expiry = 0;
      resObj = await cacheObj.touch(cKey, expiry);
      assert.equal(resObj.isSuccess(), true);

      // check if key deleted
      resObj = await cacheObj.get(cKey);
      assert.equal(resObj.isSuccess(), true);

      if (cacheObj._isConsistentBehaviour) {
        assert.equal(resObj.data.response, null);
      } else {
        if (engineType === 'memcached') {
          assert.equal(resObj.data.response, cValue);
        } else {
          assert.equal(resObj.data.response, null);
        }
      }
    });

    if (engineType !== 'none') {
      let cache3 = Cache.getInstance(configStrategy3);
      let cacheImplementer3 = cache3.cacheInstance;
      it('should pass when server is not running', async function() {
        let cKey = 'cache-key-touch' + keySuffix,
          cValue = 100,
          response = await cacheImplementer3.touch(cKey, cValue);
        assert.equal(response.isSuccess(), false);
      }).timeout(6000);
    }
  });
}

cache = Cache.getInstance(configStrategy);
cacheImplementer = cache.cacheInstance;

performTest(cacheImplementer, 'ConsistentBehaviour');
performTest(cacheImplementer, 'InconsistentBehaviour');
