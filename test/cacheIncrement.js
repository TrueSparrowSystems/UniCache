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

const engineType = configStrategy.cache.engine;

function performTest(cacheObj, keySuffix) {
  describe('Cache Increment ' + keySuffix, function() {
    keySuffix = keySuffix + '_' + new Date().getTime();

    it('should return promise', async function() {
      let cKey = 'cache-key-incr-counter' + keySuffix,
        cValue = 1,
        response = cacheObj.increment(cKey, cValue);
      assert.typeOf(response, 'Promise');
    });

    it('should fail when key/value is not passed', async function() {
      let response = await cacheObj.increment();
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is undefined', async function() {
      let cValue = 1,
        response = await cacheObj.increment(undefined, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is blank', async function() {
      let cKey = '',
        cValue = 1,
        response = await cacheObj.increment(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is number', async function() {
      let cKey = 10,
        cValue = 1,
        response = await cacheObj.increment(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key has space', async function() {
      let cKey = 'a b' + keySuffix,
        cValue = 1,
        response = await cacheObj.increment(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key length is > 250 bytes', async function() {
      let cKey = Array(252).join('x'),
        cValue = 1,
        response = await cacheObj.increment(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when value is Object', async function() {
      let cKey = 'cache-key-incr-counter' + keySuffix,
        cValue = { a: 1 },
        response = await cacheObj.increment(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when value is blank', async function() {
      let cKey = 'cache-key-incr-counter' + keySuffix,
        cValue = '',
        response = await cacheObj.increment(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when value is string', async function() {
      let cKey = 'cache-key-incr-counter' + keySuffix,
        cValue = 'String Value',
        response = await cacheObj.increment(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key has non numeric value', async function() {
      let cKey = 'cache-key-incr-non-numeric' + keySuffix,
        cValue = 'hi',
        response = await cacheObj.set(cKey, cValue);
      console.log('response1------' + JSON.stringify(response));
      assert.equal(response.isSuccess(), true);

      cValue = 10;
      response = await cacheObj.increment(cKey, cValue);
      console.log('response2------' + JSON.stringify(response));
      assert.equal(response.isSuccess(), false);
    });

    performTestWhenKeyDoesNotExists(cacheObj, keySuffix);

    it('should pass incremented by multiple integer values', async function() {
      let cKey = 'cache-key-incr-counter-key' + keySuffix,
        cValue = 10,
        response = await cacheObj.set(cKey, cValue);
      assert.equal(response.isSuccess(), true);

      // increment by default value
      resObj = await cacheObj.increment(cKey);
      assert.equal(resObj.isSuccess(), true);
      cValue += 1;
      assert.equal(resObj.data.response, cValue);

      // increment by negative value
      resObj = await cacheObj.increment(cKey, -1);
      assert.equal(resObj.isSuccess(), false);

      // increment by float value
      resObj = await cacheObj.increment(cKey, 1.2);
      assert.equal(resObj.isSuccess(), false);

      // Increment by 1
      let incrementBy = [1, 3, 2, 10, 100, 57];
      for (let i = 0; i < incrementBy.length; i++) {
        resObj = await cacheObj.increment(cKey, incrementBy[i]);
        assert.equal(resObj.isSuccess(), true);
        cValue += incrementBy[i];
        assert.equal(resObj.data.response, cValue);
      }
    });
  });
}

function performTestWhenKeyDoesNotExists(cacheObj, keySuffix) {
  const failCase = function() {
    it('should fail when key does not exist', async function() {
      let cKey = 'cache-key-incr-counter-not-exist' + keySuffix,
        cValue = 10,
        response = await cacheObj.increment(cKey, cValue);
      assert.equal(response.isSuccess(), false);
    });
  };

  const passCase = function() {
    it('should pass when key does not exist', async function() {
      let cKey = 'cache-key-incr-counter-not-exist' + keySuffix,
        cValue = 10,
        response = await cacheObj.increment(cKey, cValue);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response, cValue);
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

cache = Cache.getInstance(configStrategy);
cacheImplementer = cache.cacheInstance;

performTest(cacheImplementer, 'ConsistentBehaviour');
performTest(cacheImplementer, 'InconsistentBehaviour');
