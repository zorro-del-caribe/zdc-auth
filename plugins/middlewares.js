const logger = require('../middlewares/logger');
const bodyParser = require('koa-bodyparser');
const Pug = require('koa-pug');
const gzip = require('koa-compress');
const debug = require('debug')('zdc-auth-view');

module.exports = {
  priority: 200,
  init: function (app) {
    app
      .use(gzip())
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
          debug(this.body);
        };
        yield *next;
      });
    }
    return app;
  }
};