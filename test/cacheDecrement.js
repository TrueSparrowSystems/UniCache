// Load external packages
const chai = require('chai'),
  assert = chai.assert;

// Load cache service
const rootPrefix = '..',
  CacheKlass = require(rootPrefix + '/index'),
  testCachingEngine = process.env.TEST_CACHING_ENGINE;

let configStrategy;
if (testCachingEngine === 'redis') {
  configStrategy = require(rootPrefix + '/test/env/redis.json');
} else if (testCachingEngine === 'memcached') {
  configStrategy = require(rootPrefix + '/test/env/memcached.json');
} else if (testCachingEngine === 'none') {
  configStrategy = require(rootPrefix + '/test/env/inMemory.json');
}

const engineType = configStrategy.cache.engine;

function performTest(cacheObj, keySuffix) {
  describe('Cache Decrement ' + keySuffix, function() {
    keySuffix = keySuffix + '_' + new Date().getTime();

    it('should return promise', async function() {
      let cKey = 'cache-key-decr-counter' + keySuffix,
        cValue = 1,
        response = cacheObj.decrement(cKey, cValue);
      assert.typeOf(response, 'Promise');
    });

    it('should fail when key/value is not passed', async function() {
      let response = await cacheObj.decrement();
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is undefined', async function() {
      let cValue = 1,
        response = await cacheObj.decrement(undefined, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is blank', async function() {
      let cKey = '',
        cValue = 1,
        response = await cacheObj.decrement(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is number', async function() {
      let cKey = 10,
        cValue = 1,
        response = await cacheObj.decrement(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key has space', async function() {
      let cKey = 'a b',
        cValue = 1,
        response = await cacheObj.decrement(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key length is > 250 bytes', async function() {
      let cKey = Array(252).join('x'),
        cValue = 1,
        response = await cacheObj.decrement(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when value is Object', async function() {
      let cKey = 'cache-key-decr-counter' + keySuffix,
        cValue = { a: 1 },
        response = await cacheObj.decrement(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when value is blank', async function() {
      let cKey = 'cache-key-decr-counter' + keySuffix,
        cValue = '',
        response = await cacheObj.decrement(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when value is string', async function() {
      let cKey = 'cache-key-decr-counter' + keySuffix,
        cValue = 'String Value',
        response = await cacheObj.decrement(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key has non numeric value', async function() {
      let cKey = 'cache-key-decr-non-numeric' + keySuffix,
        cValue = 'hi',
        response = await cacheObj.set(cKey, cValue);
      assert.equal(response.isSuccess(), true);

      cValue = 10;
      response = await cacheObj.decrement(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    performTestWhenKeyDoesNotExists(cacheObj, keySuffix);

    it('should pass decremented by multiple integer values', async function() {
      let cKey = 'cache-key-decr-counter-key' + keySuffix,
        cValue = 10000,
        response = await cacheObj.set(cKey, cValue);
      assert.equal(response.isSuccess(), true);

      // decrement by default value
      resObj = await cacheObj.decrement(cKey);
      assert.equal(resObj.isSuccess(), true);
      cValue -= 1;
      assert.equal(resObj.data.response, cValue);

      // decrement by negative value
      resObj = await cacheObj.decrement(cKey, -1);
      assert.equal(resObj.isSuccess(), false);

      // decrement by float value
      resObj = await cacheObj.decrement(cKey, 1.2);
      assert.equal(resObj.isSuccess(), false);

      // decrement by 1
      let decrementBy = [1, 3, 2, 10, 100, 57];
      for (let i = 0; i < decrementBy.length; i++) {
        resObj = await cacheObj.decrement(cKey, decrementBy[i]);
        assert.equal(resObj.isSuccess(), true);
        cValue -= decrementBy[i];
        assert.equal(resObj.data.response, cValue);
      }

      // decrement by bigger number value
      resObj = await cacheObj.decrement(cKey, 100000000);
      assert.equal(resObj.isSuccess(), true);

      if (['redis', 'none'].includes(engineType) && !cacheObj._isConsistentBehaviour) {
        assert.equal(resObj.data.response, cValue - 100000000);
      } else {
        cValue = 0;
        assert.equal(resObj.data.response, cValue);
      }
    });
  });
}

function performTestWhenKeyDoesNotExists(cacheObj, keySuffix) {
  const failCase = function() {
    it('should fail when key does not exist', async function() {
      let cKey = 'cache-key-decr-counter-not-exist' + keySuffix,
        cValue = 10,
        response = await cacheObj.decrement(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });
  };

  const passCase = function() {
    it('should pass when key does not exist', async function() {
      let cKey = 'cache-key-decr-counter-not-exist' + keySuffix,
        cValue = 10,
        response = await cacheObj.decrement(cKey, cValue);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, -1 * cValue);
    });
  };

  if (cacheObj._isConsistentBehaviour) {
    failCase();
  } else {
    if (engineType === 'redis') {
      passCase();
    } else if (engineType === 'memcached') {
      failCase();
    } else if (engineType === 'none') {
      passCase();
    }
  }
}

cache = CacheKlass.getInstance(configStrategy);
cacheImplementer = cache.cacheInstance;

performTest(cacheImplementer, 'ConsistentBehaviour');
performTest(cacheImplementer, 'InconsistentBehaviour');
