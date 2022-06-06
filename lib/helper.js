const rootPrefix = '..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  generalErrorConfig = require(rootPrefix + '/config/error/general');

/**
 * Class for cache helper.
 *
 * @class CacheHelper
 */
class CacheHelper {
  // Check if cache key is valid or not
  validateCacheKey(key) {
    const oThis = this;

    if (typeof key !== 'string') {
      logger.error(`Cache key not a string: ${key}`);

      return false;
    }

    if (key === '') {
      logger.error(`Cache key should not be blank: ${key}`);

      return false;
    }

    if (oThis._validateCacheValueSize(key, 250) !== true) {
      logger.error(
        `Cache key byte size should not be > 250. Key: ${key}. Size: ${oThis._validateCacheValueSize(key, 250)}`
      );

      return false;
    }

    if (oThis._validateCacheKeyChars(key) !== true) {
      logger.error(`Cache key has unsupported chars: ${key}`);

      return false;
    }

    return true;
  }

  /**
   * Check if cache value is valid or not.
   *
   * @param {*} value
   *
   * @returns {boolean}
   */
  validateCacheValue(value) {
    const oThis = this;

    return value !== undefined && oThis._validateCacheValueSize(value, 1024 * 1024) === true;
  }

  /**
   * Check if cache expiry is valid or not.
   *
   * @param {number} value
   *
   * @returns {boolean}
   */
  validateCacheExpiry(value) {
    return !!(value && typeof value === 'number');
  }

  /**
   * Fetch error config.
   *
   * @returns {{api_error_config: *, param_error_config: {}}}
   */
  fetchErrorConfig() {
    return {
      param_error_config: {},
      api_error_config: generalErrorConfig
    };
  }

  /**
   * Check if cache value size is < size.
   *
   * @param {string} value
   * @param {number} size
   *
   * @returns {boolean}
   * @private
   */
  _validateCacheValueSize(value, size) {
    return Buffer.byteLength(JSON.stringify(value), 'utf8') <= size;
  }

  // Check key has valid chars.
  /**
   * Check key has valid chars.
   *
   * @param {string} key
   *
   * @returns {boolean}
   * @private
   */
  _validateCacheKeyChars(key) {
    return !/\s/.test(key);
  }
}

module.exports = new CacheHelper();
