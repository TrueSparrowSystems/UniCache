/**
 * Implementation of the caching layer using Memcached.
 *
 * @module lib/implementer/Memcached
 */

const Memcached = require('memcached'),
  Base = require('@plgworks/base');

const rootPrefix = '../..',
  cacheHelper = require(rootPrefix + '/lib/helper'),
  coreConstants = require(rootPrefix + '/config/coreConstant'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const InstanceComposer = Base.InstanceComposer;

require(rootPrefix + '/config/cache');

// , poolSize: 10            // maximal parallel connections
//   , retries: 5              // Connection pool retries to pull connection from pool
//   , factor: 3               // Connection pool retry exponential backoff factor
//   , minTimeout: 1000        // Connection pool retry min delay before retrying
//   , maxTimeout: 60000       // Connection pool retry max delay before retrying
//   , randomize: false        // Connection pool retry timeout randomization
//
//   , reconnect: 18000000     // if dead, attempt reconnect each xx ms
//   , timeout: 5000           // after x ms the server should send a timeout if we can't connect
//   , failures: 5             // Number of times a server can have an issue before marked dead
//   , failuresTimeout: 300000   // Time after which `failures` will be reset to original value, since last failure
//   , retry: 30000            // When a server has an error, wait this amount of time before retrying
//   , idle: 5000              // Remove connection from pool when no I/O after `idle` ms

Object.assign(Memcached.config, {
  poolSize: 200,
  retries: 5,
  factor: 1,
  reconnect: 10000,
  timeout: 500,
  failures: 5,
  failuresTimeout: 300000,
  retry: 500
});

/**
 * Class for memcached implementer.
 *
 * @class MemcachedCacheImplementer
 */
class MemcachedCacheImplementer {
  /**
   * Constructor for memcached implementer.
   *
   * @param {boolean} isConsistentBehaviour: specifies if the cache behaviour be consistent across all cache engines
   *
   * @constructor
   */
  constructor(isConsistentBehaviour) {
    const oThis = this;

    const cacheConfig = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'CacheConfigHelper');

    oThis.client = new Memcached(cacheConfig.MEMCACHE_SERVERS);
    // Error handling.
    oThis.client.on('issue', function(details) {
      let loggingStatement = 'Issue with Memcache server. Trying to resolve!';
      if (details) {
        loggingStatement += ` Details: ${JSON.stringify(details)}`;
        // If failures has been marked twice, then increase retry time to 5 seconds.
        // if (details.totalFailures && details.totalFailures >= 1) {
        //   oThis.client.retry = 5000;
        // }
      }
      logger.error(loggingStatement);
    });
    oThis.client.on('failure', function(details) {
      let loggingStatement = 'A server has been marked as failure or dead!';
      if (details) {
        loggingStatement += ` Details: ${JSON.stringify(details)}`;
      }
      logger.error(loggingStatement);
    });
    oThis.client.on('reconnecting', function(details) {
      let loggingStatement = 'We are going to attempt to reconnect the to the failed server!';
      if (details && details.server && details.totalDownTime) {
        loggingStatement += ` Total downtime caused by server: ${details.server} : ${details.totalDownTime} ms."`;
      }
      logger.info(loggingStatement);
    });
    oThis.client.on('remove', function(details) {
      let loggingStatement = 'Removing the server from our consistent hashing!';
      if (details) {
        loggingStatement += ` Details: ${JSON.stringify(details)}`;
      }
      logger.error(loggingStatement);
    });
    oThis.client.on('reconnect', function(details) {
      let loggingStatement = 'Successfully reconnected to the memcached server!';
      if (details) {
        loggingStatement += ` Details: ${JSON.stringify(details)}`;
      }
      logger.info(loggingStatement);
    });

    oThis.defaultLifetime = Number(cacheConfig.DEFAULT_TTL);

    oThis._isConsistentBehaviour = isConsistentBehaviour;

    // First time cache set was intermittently failing for memcached, thus setting test key here.
    oThis.set('plgInit', 1);
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
      // Error handling
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_m_g_1',
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
            internal_error_identifier: 'l_c_m_g_2',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: {
              key: key,
              error: err
            }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: data === undefined ? null : data }));
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

    // Perform action.
    return oThis.get(key);
  }

  /**
   * Set a new key value or update the existing key value in cache
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
          internal_error_identifier: 'l_c_m_s_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, value: value, ttl: ttl }
        });

        return onResolve(errObj);
      }
      if (cacheHelper.validateCacheValue(value) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_m_s_2',
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
            internal_error_identifier: 'l_c_m_s_3',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key, value: value, ttl: ttl }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: true }));
      };

      // Perform action.
      oThis.client.set(key, value, ttl, callback);
    });
  }

  /**
   * Cache object in cache
   *
   * @param {string} key: cache key
   * @param {*} object: object to be cached
   * @param {number} [ttl]: cache expiry in seconds. default: DEFAULT_TTL
   *
   * @return {Promise<result>}: On success, data.value is true. On failure, error details returned.
   */
  setObject(key, object, ttl) {
    const oThis = this;

    // Validate value.
    if (typeof object !== 'object') {
      const errObj = responseHelper.error({
        internal_error_identifier: 'l_c_m_so_1',
        api_error_identifier: 'invalid_cache_value',
        error_config: cacheHelper.fetchErrorConfig(),
        debug_options: { key: key, object: object, ttl: ttl }
      });

      return Promise.resolve(errObj);
    }

    // NOTE: To support redis implementation don't allow array.
    if (oThis._isConsistentBehaviour && Array.isArray(object)) {
      const errObj = responseHelper.error({
        internal_error_identifier: 'l_c_m_so_2',
        api_error_identifier: 'array_is_invalid_cache_value',
        error_config: cacheHelper.fetchErrorConfig(),
        debug_options: { key: key, object: object, ttl: ttl }
      });

      return Promise.resolve(errObj);
    }

    // Perform action.
    return oThis.set(key, object, ttl);
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
          internal_error_identifier: 'l_c_m_d_1',
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
            internal_error_identifier: 'l_c_m_d_2',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key }
          });
          onResolve(errObj);
        } else {
          onResolve(responseHelper.successWithData({ response: true }));
        }
      };

      // Perform action.
      oThis.client.del(key, callback);
    });
  }

  /**
   * Get the values of specified keys.
   *
   * @param {array} keys: cache keys
   *
   * @return {Promise<result>}: On success, data.value is object of keys and values. On failure, error details returned.
   */
  multiGet(keys) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Error handling.
      if (!Array.isArray(keys) || keys.length === 0) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_m_mg_1',
          api_error_identifier: 'cache_keys_non_array',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { keys: keys }
        });

        return onResolve(errObj);
      }
      for (let index = 0; index < keys.length; index++) {
        if (cacheHelper.validateCacheKey(keys[index]) === false) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_m_mg_2',
            api_error_identifier: 'invalid_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { invalid_key: keys[index] }
          });

          return onResolve(errObj);
        }
      }

      // Set callback method.
      const callback = function(err, data) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_m_mg_3',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, keys: keys }
          });

          return onResolve(errObj);
        }
        // Match behaviour with redis.
        for (let index = 0; index < keys.length; index++) {
          data[keys[index]] =
            typeof data[keys[index]] === 'object' || data[keys[index]] === undefined ? null : data[keys[index]];
        }
        onResolve(responseHelper.successWithData({ response: data }));
      };

      // Perform action.
      oThis.client.getMulti(keys, callback);
    });
  }

  /**
   * Increment the numeric value for the given key, if key already exists.
   *
   * @param {string} key: cache key
   * @param {int} byValue: number by which cache need to be incremented. Default: 1
   *
   * @return {Promise<result>}: On success, data.value is true. On failure, error details returned.
   */
  increment(key, byValue) {
    const oThis = this;

    byValue = byValue === undefined ? 1 : byValue;

    return new Promise(function(onResolve) {
      // Validate key and value
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_m_i_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }
      if (byValue !== parseInt(byValue, 10) || byValue < 1 || cacheHelper.validateCacheValue(byValue) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_m_i_2',
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
            internal_error_identifier: 'l_c_m_i_3',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key, byValue: byValue }
          });

          return onResolve(errObj);
        }
        if (data === false) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_m_i_4',
            api_error_identifier: 'missing_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { key: key, byValue: byValue }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: data }));
      };

      // Perform action.
      oThis.client.incr(key, byValue, callback);
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
          internal_error_identifier: 'l_c_m_t_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, lifetime: lifetime }
        });

        return onResolve(errObj);
      }
      if (lifetime !== parseInt(lifetime, 10) || lifetime < 0 || cacheHelper.validateCacheValue(lifetime) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_m_t_2',
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
            internal_error_identifier: 'l_c_m_t_3',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key, lifetime: lifetime }
          });

          return onResolve(errObj);
        }
        if (data === false) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_m_t_4',
            api_error_identifier: 'missing_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { key: key, lifetime: lifetime }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: data }));
      };

      // NOTE: To support redis implementation.
      lifetime = lifetime === 0 && oThis._isConsistentBehaviour ? -1 : lifetime;

      // Perform action.
      oThis.client.touch(key, lifetime, callback);
    });
  }

  /**
   * Decrement the numeric value for the given key, if key already exists.
   *
   * @param {string} key: cache key
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
          internal_error_identifier: 'l_c_m_d_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }
      if (byValue !== parseInt(byValue, 10) || byValue < 1 || cacheHelper.validateCacheValue(byValue) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_m_d_2',
          api_error_identifier: 'non_numeric_cache_value',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }

      // Set callback method.
      const callback = function(err, data) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_m_d_3',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key, byValue: byValue }
          });

          return onResolve(errObj);
        }
        if (data === false) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_m_d_4',
            api_error_identifier: 'missing_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { key: key, byValue: byValue }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: data }));
      };

      // Perform action.
      oThis.client.decr(key, byValue, callback);
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
          internal_error_identifier: 'l_c_m_al_1',
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
      const callback = function(err) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_m_al_2',
            api_error_identifier: 'acquire_lock_failed',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err, key: key, ttl: ttl }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData({ response: true }));
      };

      // Perform action
      oThis.client.add(key, 'LOCKED', ttl, callback);
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
      oThis.client.flush(function(err) {
        if (err) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_r_t_5',
            api_error_identifier: 'something_went_wrong',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { err: err }
          });

          return onResolve(errObj);
        }

        return onResolve(responseHelper.successWithData());
      });
    });
  }
}

InstanceComposer.registerAsShadowableClass(
  MemcachedCacheImplementer,
  coreConstants.icNameSpace,
  'MemcachedCacheImplementer'
);

module.exports = MemcachedCacheImplementer;
