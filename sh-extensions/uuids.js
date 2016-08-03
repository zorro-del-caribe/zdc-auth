const uuids = require('ship-hold-uuids');

let hasRun = false;

module.exports = {
  priority: 2,
  extension: function (sh) {
    if (hasRun === false) {
      uuids(sh); //TODO dangerous mixin modifying prototype ... must run only once
      hasRun = true;
    }
    return sh;
  }
};