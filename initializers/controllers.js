const controllers = require('../controllers');

module.exports = {
  priority: 400,
  init: function (app) {
    controllers(app);
    return app;
  }
};