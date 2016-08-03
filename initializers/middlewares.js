const logger = require('../middlewares/logger');
const bodyParser = require('koa-bodyparser');
const Pug = require('koa-pug');
//todo use debug

module.exports = {
  priority: 200,
  init: function (app) {
    app
      .use(logger())
      .use(bodyParser());

    if (process.env.NODE_ENV !== 'test') {
      const pug = new Pug({
        app,
        viewPath: './views'
      });
    } else {
      app.use(function * (next) {
        this.render = function (template, locals) {
          this.body = {template, locals};
        };
        yield *next;
      });
    }
    return app;
  }
};