/**
 * Implementation of the caching layer using Redis.
 * A persistent Redis connection per Node js worker is maintained and this connection is singleton.<br><br>
 *
 * @module lib/implementer/Redis
 */

const Base = require('@truesparrow/base'),
  redis = require('redis');

const rootPrefix = '../..',
  cacheHelper = require(rootPrefix + '/lib/helper'),
  coreConstants = require(rootPrefix + '/config/coreConstant'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const InstanceComposer = Base.InstanceComposer;

require(rootPrefix + '/config/cache');

/**
 * Class for redis cache implementer.
 *
 * @class RedisCacheImplementer
 */
class RedisCacheImplementer {
  /**
   * Constructor for redis cache implementer.
   *
   * @param {boolean} isConsistentBehaviour: specifies if the cache behaviour be consistent across all cache engines
   *
   * @constructor
   */
  constructor(isConsistentBehaviour) {
    const oThis = this;

    const cacheConfig = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'CacheConfigHelper');

    oThis.clientOptions = {
      host: cacheConfig.REDIS_HOST,
      port: cacheConfig.REDIS_PORT,
      password: cacheConfig.REDIS_PASS,
      tls: cacheConfig.REDIS_TLS_ENABLED,
      enable_offline_queue: cacheConfig.REDIS_ENABLE_OFFLINE_QUEUE
    };

    oThis.client = redis.createClient(oThis.clientOptions);

    oThis.client.on('error', function(err) {
      logger.error('Redis Error ', err);
    });

    oThis.defaultLifetime = Number(cacheConfig.DEFAULT_TTL);

    oThis._isConsistentBehaviour = isConsistentBehaviour;
  }

  /**
   * Get the cached value of a key.
   *
   * @param {string} key: cache key
   *
   * @return {Promise<result>}: On success, data.value has value. On failure, error details returned.
   */
  get(key) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Error handling.
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_g_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key }
        });

        return onResolve(errObj);
      }

      // Set callback method.
      const callback = function(err, data) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_g_2',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: data }));
      };

      // Perform action.
      oThis.client.get(key, callback);
    });
  }

  /**
   * Get the stored object value for the given key.
   *
   * @param {string} key: cache key
   *
   * @return {Promise<result>}: On success, data.value has value. On failure, error details returned.
   */
  getObject(key) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Error handling
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_go_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key }
        });

        return onResolve(errObj);
      }

      // Set callback method.
      const callback = function(err, data) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_go_2',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key }
          });

          return onResolve(errObj);
        }
        // Format data.
        for (const dataKey in data) {
          data[dataKey] = JSON.parse(data[dataKey]);
        }

        return onResolve(responseHelper.successWithData({ response: data }));
      };

      // Perform action.
      oThis.client.hgetall(key, callback);
    });
  }

  /**
   * Set a new key value or update the existing key value in cache.
   *
   * @param {string} key: cache key
   * @param {*} value: data to be cached
   * @param {number} [ttl]: cache expiry in seconds. default: DEFAULT_TTL
   *
   * @return {Promise<result>}: On success, data.value is true. On failure, error details returned.
   */
  set(key, value, ttl) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Error handling
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_s_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, value: value, ttl: ttl }
        });

        return onResolve(errObj);
      }
      if (typeof value === 'object' || cacheHelper.validateCacheValue(value) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_s_2',
          api_error_identifier: 'invalid_cache_value',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, value: value, ttl: ttl }
        });

        return onResolve(errObj);
      }
      if (cacheHelper.validateCacheExpiry(ttl) === false) {
        ttl = oThis.defaultLifetime;
      }

      // Set callback method.
      const callback = function(err) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_s_3',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key, value: value, ttl: ttl }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: true }));
      };

      // Perform action.
      oThis.client.set(key, value, 'EX', ttl, callback);
    });
  }

  /**
   * Cache object in cache.
   *
   * @param {string} key: cache key
   * @param {*} object: object to be cached
   *
   * @return {Promise<result>}: On success, data.value is true. On failure, error details returned.
   */
  setObject(key, object) {
    const oThis = this;

    return new Promise(async function(onResolve) {
      // Error handling
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_so_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, object: object }
        });

        return onResolve(errObj);
      }
      if (typeof object !== 'object' || Array.isArray(object) || cacheHelper.validateCacheValue(object) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_so_2',
          api_error_identifier: 'invalid_cache_value',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, object: object }
        });

        return onResolve(errObj);
      }

      // NOTE: hmset is always merge the value of the object, never overwrite key. So, delete before set.
      await oThis.del(key);

      // Set callback method.
      const callback = function(err) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_so_3',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key, object: object }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: true }));
      };

      // Format data.
      const arrayRepresentation = [];
      for (const objectKey in object) {
        arrayRepresentation.push(objectKey);
        arrayRepresentation.push(JSON.stringify(object[objectKey]));
      }

      // Perform action.
      // NOTE: redis hmset does not support custom TTl as of now handle it when it does.
      oThis.client.hmset(key, arrayRepresentation, callback);
    });
  }

  /**
   * Delete the key from cache.
   *
   * @param {string} key: cache key
   *
   * @return {Promise<result>}: On success, data.value is true. On failure, error details returned.
   */
  del(key) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Error handling
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_d_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key }
        });

        return onResolve(errObj);
      }

      // Set callback method.
      const callback = function(err) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_d_2',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: true }));
      };

      // Perform action.
      oThis.client.del(key, callback);
    });
  }

  /**
   * Get the values of specified keys.
   * NOTE: Object cache retrieval is not support with multiGet. It returns null value, even if value is set in cache.
   *
   * @param {array} keys: cache keys
   *
   * @return {Promise<result>}: On success, data.value is object of keys and values. On failure, error details returned.
   */
  multiGet(keys) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Error handling
      if (!Array.isArray(keys) || keys.length === 0) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_mg_1',
          api_error_identifier: 'array_is_invalid_cache_value',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { keys: keys }
        });

        return onResolve(errObj);
      }
      for (let index = 0; index < keys.length; index++) {
        if (cacheHelper.validateCacheKey(keys[index]) === false) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_mg_2',
            api_error_identifier: 'invalid_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { key: keys[index] }
          });

          return onResolve(errObj);
        }
      }

      // Set callback method.
      const callback = function(err, data) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_mg_3',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, keys: keys }
          });

          return onResolve(errObj);
        }
        const retVal = {};
        for (let index = 0; index < keys.length; index++) {
          retVal[keys[index]] = data[index];
        }

        return onResolve(responseHelper.successWithData({ response: retVal }));
      };

      // Perform action.
      oThis.client.mget(keys, callback);
    });
  }

  /**
   * Increment the numeric value for the given key, if key already exists.
   *
   * @param {string} key: cache key
   * @param {int} byValue: number by which cache need to be incremented. Default: 1
   *
   * @return {Promise<result>} - On success, data.value is true. On failure, error details returned.
   */
  increment(key, byValue) {
    const oThis = this;

    byValue = byValue === undefined ? 1 : byValue;

    return new Promise(function(onResolve) {
      // Validate key and value
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_i_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }
      if (byValue !== parseInt(byValue, 10) || byValue < 1 || cacheHelper.validateCacheValue(byValue) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_i_2',
          api_error_identifier: 'non_int_cache_value',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }

      // Set callback method.
      const callback = function(err, data) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_i_3',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key, byValue: byValue }
          });

          return onResolve(errObj);
        }
        if (data === false) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_i_4',
            api_error_identifier: 'missing_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { key: key, byValue: byValue }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: data }));
      };

      if (oThis._isConsistentBehaviour) {
        // Perform action.
        const incrementValue = function(result) {
          if (result.isSuccess() && result.data.response > 0) {
            oThis.client.incrby(key, byValue, callback);
          } else {
            const errObj = responseHelper.error({
              internal_error_identifier: 'l_c_m_i_5',
              api_error_identifier: 'missing_cache_key',
              error_config: cacheHelper.fetchErrorConfig(),
              debug_options: { key: key, byValue: byValue }
            });

            return onResolve(errObj);
          }
        };

        // NOTE: To support memcached implementation.
        oThis.get(key).then(incrementValue);
      } else {
        oThis.client.incrby(key, byValue, callback);
      }
    });
  }

  /**
   * Decrement the numeric value for the given key, if key already exists.
   *
   * @param {string} key:cache key
   * @param {int} byValue: number by which cache need to be decremented. Default: 1
   *
   * @return {Promise<result>}: On success, data.value is true. On failure, error details returned.
   */
  decrement(key, byValue) {
    const oThis = this;

    byValue = byValue === undefined ? 1 : byValue;

    return new Promise(function(onResolve) {
      // Validate key and value
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_d_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }
      if (byValue !== parseInt(byValue, 10) || byValue < 1 || cacheHelper.validateCacheValue(byValue) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_d_2',
          api_error_identifier: 'non_int_cache_value',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }

      // Set callback method.
      const callback = function(err, data) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_d_3',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key, byValue: byValue }
          });

          return onResolve(errObj);
        }
        if (data === false) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_d_4',
            api_error_identifier: 'missing_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { key: key, byValue: byValue }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: data }));
      };

      if (oThis._isConsistentBehaviour) {
        // Perform action.
        const decrementValue = function(result) {
          if (result.isSuccess() && result.data.response > 0) {
            // NOTE: To support memcached implementation.
            byValue = result.data.response < byValue ? result.data.response : byValue;
            // Decrement.
            oThis.client.decrby(key, byValue, callback);
          } else {
            const errObj = responseHelper.error({
              internal_error_identifier: 'l_c_m_d_5',
              api_error_identifier: 'missing_cache_key',
              error_config: cacheHelper.fetchErrorConfig(),
              debug_options: { key: key, byValue: byValue }
            });

            return onResolve(errObj);
          }
        };

        // NOTE: To support memcached implementation.
        oThis.get(key).then(decrementValue);
      } else {
        oThis.client.decrby(key, byValue, callback);
      }
    });
  }

  /**
   * Change the expiry time of an existing cache key.
   *
   * @param {string} key: cache key
   * @param {int} lifetime: new cache expiry in number of seconds
   *
   * @return {Promise<result>}: On success, data.value is true. On failure, error details returned.
   */
  touch(key, lifetime) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Validate key and value
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_t_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, lifetime: lifetime }
        });

        return onResolve(errObj);
      }
      if (lifetime !== parseInt(lifetime, 10) || lifetime < 0 || cacheHelper.validateCacheValue(lifetime) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_t_2',
          api_error_identifier: 'cache_expiry_nan',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, lifetime: lifetime }
        });

        return onResolve(errObj);
      }

      // Set callback method.
      const callback = function(err, data) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_t_3',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key, lifetime: lifetime }
          });

          return onResolve(errObj);
        }
        if (data === 0) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_t_4',
            api_error_identifier: 'missing_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { key: key, lifetime: lifetime }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: data }));
      };

      // Perform action.
      oThis.client.expire(key, lifetime, callback);
    });
  }

  /**
   * Acquire lock on a given key.
   *
   * @param {string} key: cache key
   * @param {int} [ttl]: (in seconds) the time after which lock would be auto released. default: DEFAULT_TTL
   *
   * @return {Promise<result>}: success if lock was acquired, else fails with error.
   */
  acquireLock(key, ttl) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Error handling
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_al_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, ttl: ttl }
        });

        return onResolve(errObj);
      }

      if (cacheHelper.validateCacheExpiry(ttl) === false) {
        ttl = oThis.defaultLifetime;
      }

      // Set callback method.
      const callback = function(err, data) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_al_2',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key, ttl: ttl }
          });

          return onResolve(errObj);
        }
        if (data === 'OK') {
          return onResolve(responseHelper.successWithData({ response: true }));
        }
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_r_al_3',
          api_error_identifier: 'acquire_lock_failed',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { data: data, key: key, ttl: ttl }
        });

        return onResolve(errObj);
      };

      // Perform action.
      oThis.client.set(key, 'LOCKED', 'NX', 'EX', ttl, callback);
    });
  }

  /**
   * Release lock on a given key.
   *
   * @param {string} key: cache key
   *
   * @return {Promise<result>}: release lock response.
   */
  releaseLock(key) {
    const oThis = this;

    return oThis.del(key);
  }

  /**
   * Delete all keys from cache.
   *
   * @return {Promise<result>}
   */
  delAll() {
    const oThis = this;

    return new Promise(function(onResolve) {
      oThis.client.flushdb(function(err) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_t_5',
            api_error_identifier: 'flush_all_keys_failed',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: {}
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData());
      });
    });
  }
}

InstanceComposer.registerAsShadowableClass(RedisCacheImplementer, coreConstants.icNameSpace, 'RedisCacheImplementer');

module.exports = RedisCacheImplementer;
