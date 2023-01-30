const Base = require('@TrueSparrowSystems/base');

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
   * @param {number} configStrategy.defaultTtl
   * @param {string} configStrategy.host
   * @param {string/number} configStrategy.port
   * @param {string} configStrategy.password
   * @param {string/number} configStrategy.enableTsl
   * @param {array<string>} [configStrategy.servers]
   * @param {string/number} configStrategy.DEBUG_ENABLED
   * @param {object} instanceComposer
   *
   * @constructor
   */
  // eslint-disable-next-line no-unused-vars
  constructor(configStrategy, instanceComposer) {
    const oThis = this;

    oThis.DEFAULT_TTL = configStrategy.defaultTtl;
    oThis.REDIS_HOST = configStrategy.host;
    oThis.REDIS_PORT = configStrategy.port;
    oThis.REDIS_PASS = configStrategy.password;
    oThis.REDIS_TLS_ENABLED = configStrategy.enableTsl == '1';
    oThis.REDIS_ENABLE_OFFLINE_QUEUE = configStrategy.enable_offline_queue == false ? false : true;
    oThis.MEMCACHE_SERVERS = (configStrategy.servers || []).map(Function.prototype.call, String.prototype.trim);
    oThis.DEBUG_ENABLED = configStrategy.DEBUG_ENABLED;

    oThis.INMEMORY_CACHE_NAMESPACE = configStrategy.namespace || '';
  }
}

InstanceComposer.registerAsObject(CacheConfigHelper, coreConstants.icNameSpace, 'CacheConfigHelper', true);

module.exports = CacheConfigHelper;
