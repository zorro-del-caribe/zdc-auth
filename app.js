const koa = require('koa');
const initializers = require('./initializers');
const http = require('http');

module.exports = function () {
  const app = koa();

  initializers(app);

  app.start = function () {
    return new Promise(function (resolve, reject) {
      const server = http.createServer(app.callback());
      app.stop = function () {
        app.context.sh.stop();
        server.close();
      };

      Object.defineProperty(app, 'server', {value: server});

      server.listen(app.context.conf.value('server.port'), function () {
        resolve(app);
      });
    });
  };

  return app;
};