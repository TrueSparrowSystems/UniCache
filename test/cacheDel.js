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

const engineType = configStrategy.engine;

function performTest(cacheObj, keySuffix) {
  describe('Cache Del ' + keySuffix, function() {
    keySuffix = keySuffix + '_' + new Date().getTime();

    it('should return promise', async function() {
      let cKey = 'cache-key' + keySuffix,
        response = cacheObj.del(cKey);
      assert.typeOf(response, 'Promise');
    });

    it('should fail when key/value is not passed', async function() {
      let response = await cacheObj.del();
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is undefined', async function() {
      let response = await cacheObj.del(undefined);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is blank', async function() {
      let cKey = '',
        response = await cacheObj.del(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is number', async function() {
      let cKey = 10,
        response = await cacheObj.del(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key has space', async function() {
      let cKey = 'a b' + keySuffix,
        response = await cacheObj.del(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key length is > 250 bytes', async function() {
      let cKey = Array(252).join('x'),
        response = await cacheObj.del(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should pass when key is not set', async function() {
      let cKey = 'cache-key-not-key-del' + keySuffix,
        response = await cacheObj.del(cKey);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, true);
    });

    it('should pass when key is set', async function() {
      let cKey = 'cache-key' + keySuffix,
        cValue = 'String Value',
        responseSet = await cacheObj.set(cKey, cValue),
        response = await cacheObj.del(cKey);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, true);
    });

    if (engineType !== 'none') {
      let cache3 = Cache.getInstance(configStrategy3);
      let cacheImplementer3 = cache3.cacheInstance;
      it('should pass when server is not running', async function() {
        let cKey = 'cache-key' + keySuffix,
          response = await cacheImplementer3.del(cKey);
        assert.equal(response.isSuccess(), false);
      }).timeout(6000);
    }

    it('should pass after deleting all keys', async function() {
      let response = await cacheObj.delAll();
      if (engineType === 'none') {
        assert.equal(response.isSuccess(), false);
      } else {
        assert.equal(response.isSuccess(), true);
      }
    });

    if (engineType !== 'none') {
      let cache3 = Cache.getInstance(configStrategy3);
      let cacheImplementer3 = cache3.cacheInstance;
      it('should pass when server is not running', async function() {
        let response = await cacheImplementer3.delAll();
        assert.equal(response.isSuccess(), false);
      }).timeout(6000);
    }
  });
}

cache = Cache.getInstance(configStrategy);
cacheImplementer = cache.cacheInstance;

performTest(cacheImplementer, 'ConsistentBehaviour');
performTest(cacheImplementer, 'InconsistentBehaviour');
