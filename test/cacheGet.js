// Load external packages
const chai = require('chai'),
  assert = chai.assert;

// Load cache service
const rootPrefix = '..',
  Cache = require(rootPrefix + '/index'),
  testCachingEngine = process.env.TEST_CACHING_ENGINE;

let configStrategy1;
let configStrategy2;
let configStrategy3;
if (testCachingEngine === 'redis') {
  configStrategy1 = require(rootPrefix + '/test/env/redis.json');
  configStrategy2 = require(rootPrefix + '/test/env/redis2.json');
  configStrategy3 = require(rootPrefix + '/test/env/redis3.json');
} else if (testCachingEngine === 'memcached') {
  configStrategy1 = require(rootPrefix + '/test/env/memcached.json');
  configStrategy2 = require(rootPrefix + '/test/env/memcached2.json');
  configStrategy3 = require(rootPrefix + '/test/env/memcached3.json');
} else if (testCachingEngine === 'none') {
  configStrategy1 = require(rootPrefix + '/test/env/inMemory.json');
  configStrategy2 = require(rootPrefix + '/test/env/inMemory2.json');
  // Config strategies are same as they won't change for in-memory.
}

const engineType = configStrategy1.cache.engine;

function performTest(cacheObj, keySuffix) {
  describe('Cache Get ' + keySuffix, function() {
    keySuffix = keySuffix + '_' + new Date().getTime();

    it('should return promise', function() {
      let cKey = 'cache-key' + keySuffix,
        response = cacheObj.get(cKey);
      assert.typeOf(response, 'Promise');
    });

    it('should fail when key is not passed', async function() {
      let response = await cacheObj.get();
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is undefined', async function() {
      let response = await cacheObj.get(undefined);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is blank', async function() {
      let cKey = '',
        response = await cacheObj.get(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is number', async function() {
      let cKey = 10,
        response = await cacheObj.get(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key has space', async function() {
      let cKey = 'a b' + keySuffix,
        response = await cacheObj.get(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key length is > 250 bytes', async function() {
      let cKey = Array(252).join('x'),
        response = await cacheObj.get(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should pass when value is not get', async function() {
      let cKey = 'cache-key-not-get' + keySuffix,
        response = await cacheObj.get(cKey);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, null);
    });

    it('should pass when value is string', async function() {
      let cKey = 'cache-key' + keySuffix,
        cValue = 'String Value',
        responseSet = await cacheObj.set(cKey, cValue),
        response = await cacheObj.get(cKey);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, cValue);
    });

    it('should pass when value is integer', async function() {
      let cKey = 'cache-key' + keySuffix,
        cValue = 10,
        responseSet = await cacheObj.set(cKey, cValue),
        response = await cacheObj.get(cKey);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, cValue);
    });

    it('should pass when value is blank', async function() {
      let cKey = 'cache-key' + keySuffix,
        cValue = '',
        responseSet = await cacheObj.set(cKey, cValue),
        response = await cacheObj.get(cKey);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, cValue);
    });

    if (engineType !== 'redis') {
      it('should pass when value is Object', async function() {
        let cKey = 'cache-key-object' + keySuffix,
          cValue = { a: 1 },
          responseSet = await cacheObj.set(cKey, cValue),
          response = await cacheObj.get(cKey);
        assert.equal(response.isSuccess(), true);
        assert.equal(typeof response.data.response, typeof cValue);
        assert.equal(JSON.stringify(response.data.response), JSON.stringify(cValue));
      });

      it('should pass when value is Array', async function() {
        let cKey = 'cache-key-object' + keySuffix,
          cValue = [1, 2, 3, 4],
          responseSet = await cacheObj.set(cKey, cValue),
          response = await cacheObj.get(cKey);
        assert.equal(response.isSuccess(), true);
        assert.equal(typeof response.data.response, typeof cValue);
        assert.equal(JSON.stringify(response.data.response), JSON.stringify(cValue));
      });
    } else {
      it('should fail when value is Object', async function() {
        let cKey = 'cache-key-object' + keySuffix,
          cValue = { a: 1 },
          responseSet = await cacheObj.setObject(cKey, cValue),
          response = await cacheObj.get(cKey);
        assert.equal(response.isSuccess(), false);
      });

      it('should fail when value is Array', async function() {
        let cKey = 'cache-key-object' + keySuffix,
          cValue = [1, 2, 3, 4],
          responseSet = await cacheObj.set(cKey, cValue),
          response = await cacheObj.get(cKey);
        assert.equal(response.isSuccess(), false);
      });
    }
  });
}

function performMultipleTest(cacheObj1, cacheObj2, keySuffix) {
  describe('Cache Multiple Get ' + keySuffix, function() {
    keySuffix = keySuffix + '_' + new Date().getTime();

    it('should pass and get different values from different cache instances for same key', async function() {
      let cKey1 = 'cache-key' + keySuffix,
        cValue1 = 'value1',
        responseSet1 = await cacheObj1.set(cKey1, cValue1),
        response1 = await cacheObj1.get(cKey1),
        cKey2 = 'cache-key' + keySuffix,
        cValue2 = 'value2',
        responseSet2 = await cacheObj2.set(cKey2, cValue2),
        response2 = await cacheObj2.get(cKey2);
      assert.equal(response1.isSuccess(), true);
      assert.equal(JSON.stringify(response1.data.response), JSON.stringify(cValue1));
      assert.equal(response2.isSuccess(), true);
      assert.equal(JSON.stringify(response2.data.response), JSON.stringify(cValue2));
    });

    it('should pass and get different values from different cache instances for different keys', async function() {
      let cKey1 = 'cache-key1' + keySuffix,
        cValue1 = 'value1',
        responseSet1 = await cacheObj1.set(cKey1, cValue1),
        response1 = await cacheObj1.get(cKey1),
        cKey2 = 'cache-key2' + keySuffix,
        cValue2 = 'value2',
        responseSet2 = await cacheObj2.set(cKey2, cValue2),
        response2 = await cacheObj2.get(cKey2);
      assert.equal(response1.isSuccess(), true);
      assert.equal(JSON.stringify(response1.data.response), JSON.stringify(cValue1));
      assert.equal(response2.isSuccess(), true);
      assert.equal(JSON.stringify(response2.data.response), JSON.stringify(cValue2));
    });

    it('should fail when proper cache instances are not used', async function() {
      let cKey1 = 'cache-key1' + keySuffix,
        cValue1 = 'value1',
        responseSet1 = await cacheObj1.set(cKey1, cValue1),
        cKey2 = 'cache-key2' + keySuffix,
        cValue2 = 'value2',
        responseSet2 = await cacheObj2.set(cKey2, cValue2),
        response1 = await cacheObj2.get(cKey1),
        response2 = await cacheObj1.get(cKey2);
      assert.equal(response1.isSuccess(), true);
      assert.equal(response1.data.response, null);
      assert.equal(response2.isSuccess(), true);
      assert.equal(response2.data.response, null);
    });

    if (engineType === 'memcached') {
      let cache3 = Cache.getInstance(configStrategy3);
      let cacheImplementer3 = cache3.cacheInstance;
      cacheImplementer3.client.reconnect = 100;
      it('should pass when server is not running', async function() {
        let cKey = 'cache-key' + keySuffix,
          response = await cacheImplementer3.get(cKey);
        assert.equal(response.isSuccess(), false);
      }).timeout(6000);
    }
  });
}

cache1 = Cache.getInstance(configStrategy1);
cacheImplementer1 = cache1.cacheInstance;

cache2 = Cache.getInstance(configStrategy2);
cacheImplementer2 = cache2.cacheInstance;

performTest(cacheImplementer1, 'ConsistentBehaviour');
performTest(cacheImplementer1, 'InconsistentBehaviour');
performMultipleTest(cacheImplementer1, cacheImplementer2, 'ConsistentBehaviour');
performMultipleTest(cacheImplementer1, cacheImplementer2, 'InconsistentBehaviour');
