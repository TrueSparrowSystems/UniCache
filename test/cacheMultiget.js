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
  describe('Cache MultiGet ' + keySuffix, function() {
    keySuffix = keySuffix + '_' + new Date().getTime();

    it('should return promise', async function() {
      let cKey = ['cache-key' + keySuffix],
        response = cacheObj.multiGet(cKey);
      assert.typeOf(response, 'Promise');
    });

    it('should fail when key is not passed', async function() {
      let response = await cacheObj.multiGet();
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is empty array', async function() {
      let response = await cacheObj.multiGet([]);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is undefined', async function() {
      let response = await cacheObj.multiGet([undefined]);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is blank', async function() {
      let cKey = [''],
        response = await cacheObj.multiGet(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key is number', async function() {
      let cKey = [10],
        response = await cacheObj.multiGet(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key has space', async function() {
      let cKey = ['a b' + keySuffix],
        response = await cacheObj.multiGet(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should fail when key length is > 250 bytes', async function() {
      let cKey = [Array(252).join('x')],
        response = await cacheObj.multiGet(cKey);
      assert.equal(response.isSuccess(), false);
    });

    it('should pass when value is not set', async function() {
      let cKey = ['cache-key-not-set' + keySuffix],
        response = await cacheObj.multiGet(cKey);
      assert.equal(response.isSuccess(), true);
      assert.equal(response.data.response['cache-key-not-set'], null);
    });

    it('should pass when non object values are get', async function() {
      let keyValue = {};

      keyValue[`cache-key-string${keySuffix}`] = 'String Value';
      keyValue[`cache-key-integer${keySuffix}`] = 10;
      keyValue[`cache-key-blank${keySuffix}`] = '';

      for (let key in keyValue) {
        res = await cacheObj.set(key, keyValue[key]);
      }

      let lookupKeys = Object.keys(keyValue),
        response = await cacheObj.multiGet(lookupKeys);

      assert.equal(response.isSuccess(), true);
      for (let key in response.data.response) {
        assert.equal(response.data.response[key], keyValue[key]);
      }
    });

    it('should return null when object values are get', async function() {
      let keyValue = {};
      keyValue[`cache-key-array${keySuffix}`] = [1, 2, 3, 4];
      keyValue[`cache-key-object${keySuffix}`] = { a: 1 };

      for (let key in keyValue) {
        res = await cacheObj.set(key, keyValue[key]);
      }

      let lookupKeys = Object.keys(keyValue),
        response = await cacheObj.multiGet(lookupKeys);

      assert.equal(response.isSuccess(), true);
      for (let key in response.data.response) {
        assert.equal(response.data.response[key], null);
      }
    });

    if (engineType !== 'none') {
      let cache3 = Cache.getInstance(configStrategy3);
      let cacheImplementer3 = cache3.cacheInstance;
      it('should pass when server is not running', async function() {
        let cKey = ['cache-key' + keySuffix],
          response = await cacheImplementer3.multiGet(cKey);
        assert.equal(response.isSuccess(), false);
      }).timeout(6000);
    }
  });
}

cache = Cache.getInstance(configStrategy);
cacheImplementer = cache.cacheInstance;

performTest(cacheImplementer, 'ConsistentBehaviour');
performTest(cacheImplementer, 'InconsistentBehaviour');
