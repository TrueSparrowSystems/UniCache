/**
 * Index File for @TrueSparrowSystems/cache
 */

const Base = require('@TrueSparrowSystems/base');

const rootPrefix = '.',
  version = require(rootPrefix + '/package.json').version,
  coreConstant = require(rootPrefix + '/config/coreConstant');

const InstanceComposer = Base.InstanceComposer;

require(rootPrefix + '/services/CacheInstance');

const Cache = function(configStrategy) {
  const oThis = this;

  if (!configStrategy) {
    throw 'Mandatory argument configStrategy missing';
  }

  const instanceComposer = new InstanceComposer(configStrategy);
  oThis.ic = function() {
    return instanceComposer;
  };
};

Cache.prototype = {
  version: version
};

Object.defineProperty(Cache.prototype, 'cacheInstance', {
  get: function() {
    const oThis = this;
    return oThis.ic().getInstanceFor(coreConstant.icNameSpace, 'getCacheInstance');
  }
});

const instanceMap = {};

/**
 * Creates the key for the instanceMap.
 *
 * @returns {string}
 *
 */
const getInstanceKey = function(configStrategy) {
  if (!configStrategy.hasOwnProperty('engine')) {
    throw 'CACHING_ENGINE parameter is missing.';
  }
  if (configStrategy.engine === undefined) {
    throw 'CACHING_ENGINE parameter is empty.';
  }

  // Grab the required details from the configStrategy.
  const cacheEngine = configStrategy.engine.toString();
  let isConsistentBehaviour = configStrategy.consistentBehavior;

  // Sanitize isConsistentBehaviour
  isConsistentBehaviour = isConsistentBehaviour === undefined ? true : isConsistentBehaviour != '0';

  // Stores the endpoint for key generation of instanceMap.
  let endpointDetails = null;

  // Generate endpointDetails for key generation of instanceMap.
  if (cacheEngine == 'redis') {
    const redisMandatoryParams = ['host', 'port', 'password', 'enableTsl'];

    // Check if all the mandatory connection parameters for Redis are available or not.
    for (let i = 0; i < redisMandatoryParams.length; i++) {
      if (!configStrategy.hasOwnProperty(redisMandatoryParams[i])) {
        throw 'Redis - mandatory connection parameters missing.';
      }
      if (configStrategy[redisMandatoryParams[i]] === undefined) {
        throw 'Redis - connection parameters are empty.';
      }
    }

    endpointDetails =
      configStrategy.host.toLowerCase() +
      '-' +
      configStrategy.port.toString() +
      '-' +
      configStrategy.enableTsl.toString();
  } else if (cacheEngine == 'memcached') {
    if (!configStrategy.hasOwnProperty('servers')) {
      throw 'Memcached - mandatory connection parameters missing.';
    }
    if (configStrategy.servers === undefined) {
      throw 'MEMCACHE_SERVERS(configStrategy.servers) parameter is empty. ';
    }
    endpointDetails = configStrategy.servers.join(',').toLowerCase();
  } else {
    endpointDetails = configStrategy.namespace || '';
  }

  return cacheEngine + '-' + isConsistentBehaviour.toString() + '-' + endpointDetails;
};

let Factory = function() {};

Factory.prototype = {
  /**
   * Fetches a cache instance if available in instanceMap. If instance is not available in
   * instanceMap, it calls createCacheInstance() to create a new cache instance.
   *
   * @returns {cacheInstance}
   *
   */
  getInstance: function(configStrategy) {
    let instanceKey = getInstanceKey(configStrategy);

    let _instance = instanceMap[instanceKey];

    if (!_instance) {
      _instance = new Cache(configStrategy);
      instanceMap[instanceKey] = _instance;
    }

    return _instance;
  }
};

const factory = new Factory();
Cache.getInstance = function() {
  return factory.getInstance.apply(factory, arguments);
};

module.exports = Cache;
