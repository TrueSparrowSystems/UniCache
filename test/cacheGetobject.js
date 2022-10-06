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
} else if (testCachingEngine === 'none') {
  configStrategy = require(rootPrefix + '/test/env/inMemory.json');
}

const engineType = configStrategy.cache.engine;

function performTest(cacheObj, keySuffix) {
  describe('Cache GetObject ' + keySuffix, function() {
    keySuffix = keySuffix + '_' + new Date().getTime();

    it('should return promise', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        response = cacheObj.getObject(cKey);
      assert.typeOf(response, 'Promise');
    });

    it('should fail when key/value is not passed', async function() {
      let response = await cacheObj.getObject();
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is undefined', async function() {
      let response = await cacheObj.getObject(undefined);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is blank', async function() {
      let cKey = '',
        response = await cacheObj.getObject(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is number', async function() {
      let cKey = 10,
        response = await cacheObj.getObject(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key has space', async function() {
      let cKey = 'a b' + keySuffix,
        response = await cacheObj.getObject(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key length is > 250 bytes', async function() {
      let cKey = Array(252).join('x'),
        response = await cacheObj.getObject(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should pass when value is not set', async function() {
      let cKey = 'cache-key-not-set' + keySuffix,
        response = await cacheObj.getObject(cKey);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, null);
    });

    it('should pass when value is object', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = { a: 'a' },
        responseSet = await cacheObj.setObject(cKey, cValue),
        response = await cacheObj.getObject(cKey);
      assert.equal(response.isSuccess(), true);
      assert.equal(typeof response.data.response, typeof cValue);
      assert.equal(JSON.stringify(response.data.response), JSON.stringify(cValue));
    });

    it('should pass when value is complex object', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = { a: 'a', b: [12, 23], c: true, d: 1, e: { f: 'hi', g: 1 } },
        responseSet = await cacheObj.setObject(cKey, cValue),
        response = await cacheObj.getObject(cKey);
      assert.equal(response.isSuccess(), true);
      assert.equal(typeof response.data.response, typeof cValue);
      assert.equal(JSON.stringify(response.data.response), JSON.stringify(cValue));
    });

    if (engineType == 'redis') {
      let cache3 = Cache.getInstance(configStrategy3);
      let cacheImplementer3 = cache3.cacheInstance;
      it('should pass when server is not running', async function() {
        let cKey = 'cache-key' + keySuffix,
          response = await cacheImplementer3.getObject(cKey);
        assert.equal(response.isSuccess(), false);
      });
    }
  });
}

cache = Cache.getInstance(configStrategy);
cacheImplementer = cache.cacheInstance;

performTest(cacheImplementer, 'ConsistentBehaviour');
performTest(cacheImplementer, 'InconsistentBehaviour');
