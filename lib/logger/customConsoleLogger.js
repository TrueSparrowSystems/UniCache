const Base = require('@plgworks/base');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstant');

const Logger = Base.Logger;

// Following is to ensure that INFO logs are printed when debug is off.
const loggerLevel = Number(coreConstants.DEBUG_ENABLED) === 1 ? Logger.LOG_LEVELS.DEBUG : Logger.LOG_LEVELS.INFO;

module.exports = new Logger('custom-cache', loggerLevel);
