/**
 * Class for core constants.
 *
 * @class CoreConstant
 */
class CoreConstant {
  /**
   * Returns IC namespace.
   *
   * @returns {string}
   */
  get icNameSpace() {
    return 'Cache';
  }

  /**
   * Returns debug enabled or not.
   *
   * @returns {boolean}
   */
  // TODO - take it from config
  get DEBUG_ENABLED() {
    // eslint-disable-next-line no-process-env
    return process.env.DEBUG_ENABLED;
  }
}

module.exports = new CoreConstant();
