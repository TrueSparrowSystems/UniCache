// Load external packages
const chai = require('chai'),
  assert = chai.assert;

// Load cache service
const rootPrefix = '..',
  Cache = require(rootPrefix + '/index'),
  testCachingEngine = process.env.TEST_CACHING_ENGINE;

let configStrategy;
if (testCachingEngine === 'redis') {
  configStrategy = require(rootPrefix + '/test/env/redis.json');
} else if (testCachingEngine === 'memcached') {
  configStrategy = require(rootPrefix + '/test/env/memcached.json');
} else if (testCachingEngine === 'none') {
  configStrategy = require(rootPrefix + '/test/env/inMemory.json');
}

const engineType = configStrategy.engine;

function performTest(cacheObj, keySuffix) {
  describe('Cache SetObject ' + keySuffix, function() {
    keySuffix = keySuffix + '_' + new Date().getTime();

    it('should return promise', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = { a: 1 },
        response = cacheObj.setObject(cKey, cValue);
      assert.typeOf(response, 'Promise');
    });

    it('should fail when key/value is not passed', async function() {
      let response = await cacheObj.setObject();
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is undefined', async function() {
      let cValue = { a: 1 },
        response = await cacheObj.setObject(undefined, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is blank', async function() {
      let cKey = '',
        cValue = { a: 1 },
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is number', async function() {
      let cKey = 10,
        cValue = { a: 1 },
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key has space', async function() {
      let cKey = 'a b' + keySuffix,
        cValue = { a: 1 },
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key length is > 250 bytes', async function() {
      let cKey = Array(252).join('x'),
        cValue = { a: 1 },
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when value is not Object', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = 'cache-value',
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when value is undefined', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        response = await cacheObj.setObject(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when value size is > 1 MB', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = { a: Array(1050000).join('x') },
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when value is string', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = 'String Value',
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when value is integer', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = 10,
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when value is blank', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = '',
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    performTestWhenValueIsArray(cacheObj, keySuffix);

    it('should pass when value is object', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = { a: 'a' },
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, true);
    });

    it('should pass when value is complex object', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = { a: 'a', b: [12, 23], c: true, d: 1 },
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, true);
    });

    it('should fail when value is empty object for redis', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = {},
        response = await cacheObj.setObject(cKey, cValue);
      if (engineType === 'redis') {
        assert.equal(response.isSuccess(), false);
      } else {
        assert.equal(response.isSuccess(), true);
      }
    });

    it('should delete from cache after ttl (if cache engine is not redis)', async function() {
      let cKey = 'cache-key' + keySuffix,
        cValue = { a: 'a', b: [12, 23], c: true, d: 1 },
        ttl = 6, // seconds
        response = await cacheObj.setObject(cKey, cValue, ttl);
      setTimeout(async function() {
        response = await cacheObj.getObject(cKey);
        assert.equal(response.isSuccess(), true);
        if (engineType != 'redis') {
          assert.equal(response.data.response, null);
        } else {
          assert.equal(response.data.response, true);
        }
      }, ttl * 1000);
    });
  });
}

function performTestWhenValueIsArray(cacheObj, keySuffix) {
  const failCase = function() {
    it('should fail when value is Array', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = [12, 23],
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });
  };

  const passCase = function() {
    it('should pass when value is Array', async function() {
      let cKey = 'cache-key-object' + keySuffix,
        cValue = [12, 23],
        response = await cacheObj.setObject(cKey, cValue);
      assert.equal(response.isSuccess(), true);

      const getResponse = await cacheObj.getObject(cKey);
      assert.deepEqual(cValue, getResponse.data.response);
    });
  };

  if (cacheObj._isConsistentBehaviour) {
    failCase();
  } else {
    if (engineType === 'redis') {
      failCase();
    } else if (engineType === 'memcached') {
      passCase();
    } else if (engineType === 'none') {
      passCase();
    }
  }
}

cache = Cache.getInstance(configStrategy);
cacheImplementer = cache.cacheInstance;

performTest(cacheImplementer, 'ConsistentBehaviour');
performTest(cacheImplementer, 'InconsistentBehaviour');
