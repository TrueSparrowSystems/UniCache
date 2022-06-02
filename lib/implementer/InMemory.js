/**
 * Implementation of the caching layer using in-process memory.
 * NOTE: This should only be used for dev env having only one worker process,
 * otherwise this will result in inconsistent cache.
 *
 * @module lib/implementer/InMemory
 */

const Base = require('@plgworks/base');

const rootPrefix = '../..',
  cacheHelper = require(rootPrefix + '/lib/helper'),
  coreConstants = require(rootPrefix + '/config/coreConstant'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const InstanceComposer = Base.InstanceComposer;

require(rootPrefix + '/config/cache');

/**
 * Class to manage cache in memory.
 *
 * @class InMemoryCacheImplementer
 */
class InMemoryCacheImplementer {
  /**
   * Constructor to manage cache in memory.
   *
   * @param {boolean} isConsistentBehaviour: specifies if the cache behaviour be consistent accross all cache engines
   *
   * @constructor
   */
  constructor(isConsistentBehaviour) {
    const oThis = this;

    const cacheConfig = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'CacheConfigHelper');

    oThis._records = Object.create(null);

    oThis.defaultLifetime = Number(cacheConfig.DEFAULT_TTL);
    oThis._isConsistentBehaviour = isConsistentBehaviour;
  }

  /**
   * Get the cached value of a key.
   *
   * @param {string} key: cache key
   *
   * @returns {Promise<result>}: On success, data.value has value. On failure, error details returned.
   */
  get(key) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Validate key and value
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_g_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key }
        });

        return onResolve(errObj);
      }

      // Perform action.
      const record = oThis._getRecord(key);
      const val = record ? record.getValue() : null;

      return onResolve(responseHelper.successWithData({ response: val }));
    });
  }

  /**
   * Get the stored object value for the given key.
   *
   * @param {string} key: cache key
   *
   * @returns {Promise<result>} - On success, data.value has value. On failure, error details returned.
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
   * @returns {Promise<result>} - On success, data.value is true. On failure, error details returned.
   */
  set(key, value, ttl) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Validate key and value
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_s_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, value: value, ttl: ttl }
        });

        return onResolve(errObj);
      }
      if (cacheHelper.validateCacheValue(value) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_s_2',
          api_error_identifier: 'invalid_cache_value',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, value: value, ttl: ttl }
        });

        return onResolve(errObj);
      }
      if (cacheHelper.validateCacheExpiry(ttl) === false) {
        ttl = oThis.defaultLifetime;
      }

      // Perform action
      let record = oThis._getRecord(key);
      if (record) {
        record.setValue(value);
      } else {
        record = new Record(value, ttl);
      }
      oThis._records[key] = record;

      return onResolve(responseHelper.successWithData({ response: true }));
    });
  }

  /**
   * Cache object in cache
   *
   * @param {string} key: cache key
   * @param {*} object: object to be cached
   * @param {number} [ttl]: cache expiry in seconds. default: DEFAULT_TTL
   *
   * @returns {Promise<result>}: On success, data.value is true. On failure, error details returned.
   */
  setObject(key, object, ttl) {
    const oThis = this;

    // Validate value.
    if (typeof object !== 'object') {
      const errObj = responseHelper.error({
        internal_error_identifier: 'l_c_im_so_1',
        api_error_identifier: 'invalid_cache_value',
        error_config: cacheHelper.fetchErrorConfig(),
        debug_options: { key: key, object: object, ttl: ttl }
      });

      return Promise.resolve(errObj);
    }

    // NOTE: To support redis implementation don't allow array.
    if (oThis._isConsistentBehaviour && Array.isArray(object)) {
      const errObj = responseHelper.error({
        internal_error_identifier: 'l_c_im_so_2',
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
   * @returns {Promise<result>}: On success, data.value is true. On failure, error details returned.
   */
  del(key) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Validate key and value
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_d_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key }
        });

        return onResolve(errObj);
      }

      // Perform action.
      const record = oThis._getRecord(key);
      if (record) {
        delete oThis._records[key];
      }

      return onResolve(responseHelper.successWithData({ response: true }));
    });
  }

  /**
   * Get the values of specified keys.
   *
   * @param {array<string>} keys: cache keys
   *
   * @returns {Promise<result>}: On success, data.value is object of keys and values. On failure, error details returned.
   */
  multiGet(keys) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Validate keys
      if (!Array.isArray(keys) || keys.length === 0) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_mg_1',
          api_error_identifier: 'cache_keys_non_array',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { keys: keys }
        });

        return onResolve(errObj);
      }
      for (let index = 0; index < keys.length; index++) {
        if (cacheHelper.validateCacheKey(keys[index]) === false) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_im_mg_2',
            api_error_identifier: 'invalid_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { invalid_key: keys[index] }
          });

          return onResolve(errObj);
        }
      }

      // Perform action.
      const retVal = {};
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        const record = oThis._getRecord(key);
        let val = record ? record.getValue() : null;
        // Match behaviour with redis.
        val = typeof val === 'object' ? null : val;
        retVal[key] = val;
      }
      onResolve(responseHelper.successWithData({ response: retVal }));
    });
  }

  /**
   * Increment the numeric value for the given key, if key already exists.
   *
   * @param {string} key: cache key
   * @param {int} byValue: number by which cache need to be incremented. Default: 1
   *
   * @returns {Promise<result>}: On success, data.value is true. On failure, error details returned.
   */
  increment(key, byValue) {
    const oThis = this;

    byValue = byValue === undefined ? 1 : byValue;

    return new Promise(async function(onResolve) {
      // Validate key and value
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_i_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }
      if (byValue !== parseInt(byValue, 10) || byValue < 1 || cacheHelper.validateCacheValue(byValue) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_i_2',
          api_error_identifier: 'non_int_cache_value',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }

      // Check if key exists or not.
      let record = oThis._getRecord(key);

      if (!record) {
        // NOTE: To support memcached implementation.
        if (oThis._isConsistentBehaviour) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_im_i_3',
            api_error_identifier: 'missing_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { key: key, byValue: byValue }
          });

          return onResolve(errObj);
        }

        // Set the record.
        const setResponse = await oThis.set(key, 0);
        if (setResponse.isFailure()) {
          return onResolve(setResponse);
        }
        record = oThis._getRecord(key);
        if (!record) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_im_i_4',
            api_error_identifier: 'missing_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { key: key, byValue: byValue }
          });

          return onResolve(errObj);
        }
      }

      // Check exiting value is numeric.
      let originalValue = record.getValue();
      if (isNaN(originalValue)) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_i_5',
          api_error_identifier: 'non_numeric_cache_value',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }

      // Perform action.
      originalValue += byValue;
      record.setValue(originalValue);

      return onResolve(responseHelper.successWithData({ response: originalValue }));
    });
  }

  /**
   * Decrement the numeric value for the given key, if key already exists.
   *
   * @param {string} key: cache key
   * @param {int} byValue: number by which cache need to be decremented. Default: 1
   *
   * @returns {Promise<result>}: On success, data.value is true. On failure, error details returned.
   */
  decrement(key, byValue) {
    const oThis = this;

    byValue = byValue === undefined ? 1 : byValue;

    return new Promise(async function(onResolve) {
      // Validate key and value
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_d_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }
      if (byValue !== parseInt(byValue, 10) || byValue < 1 || cacheHelper.validateCacheValue(byValue) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_d_2',
          api_error_identifier: 'non_int_cache_value',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }

      // Check if key exists or not.
      let record = oThis._getRecord(key);

      if (!record) {
        // NOTE: To support memcached implementation
        if (oThis._isConsistentBehaviour) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_im_d_3',
            api_error_identifier: 'missing_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { key: key, byValue: byValue }
          });

          return onResolve(errObj);
        }

        // Set the record.
        const setResponse = await oThis.set(key, 0);
        if (setResponse.isFailure()) {
          return onResolve(setResponse);
        }
        record = oThis._getRecord(key);
        if (!record) {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_c_im_d_4',
            api_error_identifier: 'missing_cache_key',
            error_config: cacheHelper.fetchErrorConfig(),
            debug_options: { key: key, byValue: byValue }
          });

          return onResolve(errObj);
        }
      }

      // Check exiting value is numeric.
      let originalValue = record.getValue();
      if (isNaN(originalValue)) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_d_5',
          api_error_identifier: 'non_numeric_cache_value',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, byValue: byValue }
        });

        return onResolve(errObj);
      }

      // NOTE: To support memcached implementation.
      byValue = originalValue < byValue && oThis._isConsistentBehaviour ? originalValue : byValue;

      // Perform action.
      originalValue += byValue * -1;
      record.setValue(originalValue);

      return onResolve(responseHelper.successWithData({ response: originalValue }));
    });
  }

  /**
   * Change the expiry time of an existing cache key.
   *
   * @param {string} key: cache key
   * @param {int} lifetime: new cache expiry in number of seconds
   *
   * @returns {Promise<result>}: On success, data.value is true. On failure, error details returned.
   */
  touch(key, lifetime) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Validate key and value.
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_t_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, lifetime: lifetime }
        });

        return onResolve(errObj);
      }
      if (lifetime !== parseInt(lifetime, 10) || lifetime < 0 || cacheHelper.validateCacheValue(lifetime) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_t_2',
          api_error_identifier: 'cache_expiry_nan',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, lifetime: lifetime }
        });

        return onResolve(errObj);
      }

      const record = oThis._getRecord(key);

      if (!record) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_t_3',
          api_error_identifier: 'missing_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, lifetime: lifetime }
        });

        return onResolve(errObj);
      }

      // Perform action.
      record.setExpires(lifetime);

      return onResolve(responseHelper.successWithData({ response: true }));
    });
  }

  /**
   * Internal method to get record Object for a given key.
   *
   * @param {string} key: cache key
   *
   * @returns {object}
   */
  _getRecord(key) {
    let record = null;
    if (key in this._records) {
      record = this._records[key];
      if (record.hasExpired()) {
        delete this._records[key];
        record = null;
      }
    }

    return record;
  }

  /**
   * Acquire lock on a given key.
   *
   * @param {string} key: cache key
   * @param {int} [ttl]: (in seconds) the time after which lock would be auto released. default: DEFAULT_TTL
   *
   * @returns {Promise<result>}: Success if lock was acquired, else fails with error.
   */
  acquireLock(key, ttl) {
    const oThis = this;

    return new Promise(function(onResolve) {
      // Validate key and value
      if (cacheHelper.validateCacheKey(key) === false) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_al_1',
          api_error_identifier: 'invalid_cache_key',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, ttl: ttl }
        });

        return onResolve(errObj);
      }

      if (cacheHelper.validateCacheExpiry(ttl) === false) {
        ttl = oThis.defaultLifetime;
      }

      const record = oThis._getRecord(key);

      if (record) {
        const errObj = responseHelper.error({
          internal_error_identifier: 'l_c_im_al_2',
          api_error_identifier: 'acquire_lock_failed',
          error_config: cacheHelper.fetchErrorConfig(),
          debug_options: { key: key, ttl: ttl }
        });

        return onResolve(errObj);
      }

      // Perform action.
      return oThis.set(key, 'LOCKED', ttl).then(function(response) {
        if (response.isFailure()) {
          return onResolve(response);
        }

        return onResolve(responseHelper.successWithData({ response: true }));
      });
    });
  }

  /**
   * Release lock on a given key.
   *
   * @param {string} key: cache key
   *
   * @returns {Promise<result>}: release lock response.
   */
  releaseLock(key) {
    const oThis = this;

    return oThis.del(key);
  }

  /**
   * Delete all keys from cache.
   *
   * @returns {Promise<result>}
   */
  delAll() {
    return new Promise(function(onResolve) {
      const errObj = responseHelper.error({
        internal_error_identifier: 'l_c_im_d_6',
        api_error_identifier: 'flush_all_not_supported',
        error_config: cacheHelper.fetchErrorConfig(),
        debug_options: {}
      });

      return onResolve(errObj);
    });
  }
}

const farFutureLifeTime = Date.now() + 1000 * 60 * 60 * 24 * 365 * 20;

function Record(value, lifetimeInSec) {
  this.setValue(value);
  lifetimeInSec && this.setExpires(lifetimeInSec);
}

Record.prototype = {
  constructor: Record,

  /**
   * @property val Value of record. Defaults to null.
   */
  val: null,

  /**
   * @property expires Expiry timestamp of record. Defaults to farFutureLifeTime (20 years from server start time).
   */
  expires: Date.now() + farFutureLifeTime,

  /**
   * Sets the expiry timestamp of the record.
   *
   * @param {number} lifetimeInSec: life-time is seconds after which record is considered expired.
   */
  setExpires: function(lifetimeInSec) {
    lifetimeInSec = Number(lifetimeInSec);
    if (isNaN(lifetimeInSec)) {
      lifetimeInSec = 0;
    }

    const lifetime = lifetimeInSec * 1000;
    if (lifetime <= 0) {
      this.expires = Date.now();
    } else {
      this.expires = Date.now() + lifetime;
    }
  },

  /**
   * @returns {boolean} returns true if the current time is greater than expiry timestamp.
   */
  hasExpired: function() {
    return this.expires - Date.now() <= 0;
  },

  /**
   * @returns {*} returns the value set of the record.
   */
  getValue: function() {
    return this.val;
  },

  /**
   * Sets the value of the record.
   *
   * @param {*} val: Value to set.
   */
  setValue: function(val) {
    this.val = val;
  },

  /**
   * Returns the serialized value of record.
   * If value is Object, serialized object is returned.
   *
   * @returns {string} serialized value
   */
  toString: function() {
    if (this.val instanceof Object) {
      return JSON.stringify(this.val);
    }

    return String(this.val);
  }
};

InstanceComposer.registerAsShadowableClass(
  InMemoryCacheImplementer,
  coreConstants.icNameSpace,
  'InMemoryCacheImplementer'
);

module.exports = InMemoryCacheImplementer;
