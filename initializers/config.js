const conf = require('conf-load')();

module.exports = {
  priority: 1,
  init: function (app) {
    app.context.conf = conf;
    return app;
  }
};