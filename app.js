const bucanero = require('bucanero');

module.exports = function (options = {}) {
  const plugins = options.plugins || [];
  plugins.push('bucanero-router','bucanero-tanker');
  options.plugins = plugins;
  return bucanero(options);
};