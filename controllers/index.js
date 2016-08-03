const path = require('path');
const Router = require('koa-router');
const fs = require('fs');
const root = require('app-root-path').toString();
const validator = require('koa-json-schema');

module.exports = function (koaApp) {
  const controllers = fs
    .readdirSync(path.join(root, './controllers'))
    .filter(f=>f !== 'index.js')
    .forEach(f=> {
      const [namespace] = f.split('.');
      const controller = require(path.join(root, 'controllers', f));
      const router = new Router({prefix: '/' + namespace});
      for (const key of Object.keys(controller)) {
        const {method, path, handler, schema} = controller[key];
        const handlers = Array.isArray(handler) ? handler : [handler];
        if (schema) {
          handlers.unshift(validator(schema));
        }
        router[method](key, path, ...handlers);
      }

      koaApp
        .use(router.routes())
        .use(router.allowedMethods());
    });

  return koaApp;
};
