const Base = require('@plgworks/base');

const rootPrefix = '..',
  coreConstants = require(rootPrefix + '/config/coreConstant');

const InstanceComposer = Base.InstanceComposer;
/**
 * Class for cache config helper.
 *
 * @class CacheConfigHelper
 */
class CacheConfigHelper {
  /**
   * Constructor for cache config helper.
   *
   * @param {object} configStrategy
   * @param {object} configStrategy.cache
   * @param {number} configStrategy.cache.defaultTtl
   * @param {string} configStrategy.cache.host
   * @param {string/number} configStrategy.cache.port
   * @param {string} configStrategy.cache.password
   * @param {string/number} configStrategy.cache.enableTsl
   * @param {array<string>} [configStrategy.cache.servers]
   * @param {string/number} configStrategy.DEBUG_ENABLED
   * @param {object} instanceComposer
   *
   * @constructor
   */
  // eslint-disable-next-line no-unused-vars
  constructor(configStrategy, instanceComposer) {
    const oThis = this;

    oThis.DEFAULT_TTL = configStrategy.cache.defaultTtl;
    oThis.REDIS_HOST = configStrategy.cache.host;
    oThis.REDIS_PORT = configStrategy.cache.port;
    oThis.REDIS_PASS = configStrategy.cache.password;
    oThis.REDIS_TLS_ENABLED = configStrategy.cache.enableTsl == '1';
    oThis.MEMCACHE_SERVERS = (configStrategy.cache.servers || []).map(Function.prototype.call, String.prototype.trim);
    oThis.DEBUG_ENABLED = configStrategy.DEBUG_ENABLED;

    oThis.INMEMORY_CACHE_NAMESPACE = configStrategy.cache.namespace || '';
  }
}

InstanceComposer.registerAsObject(CacheConfigHelper, coreConstants.icNameSpace, 'CacheConfigHelper', true);

module.exports = CacheConfigHelper;
