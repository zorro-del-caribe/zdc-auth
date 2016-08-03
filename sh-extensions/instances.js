const instances = require('ship-hold-dao');

module.exports = {
  priority: 5,
  extension: function (sh) {
    return instances(sh);
  }
};