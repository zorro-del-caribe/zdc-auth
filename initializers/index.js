const fs = require('fs')
const path = require('path');
const root = require('app-root-path').toString();

module.exports = function (koaApp) {
  const sortedInitializers = fs
    .readdirSync(path.join(root, './initializers'))
    .filter(f=>f !== 'index.js')
    .map(f=>require(path.join(root, 'initializers', f)))
    .sort((a, b)=>a.priority < b.priority ? -1 : 1);

  for (const initializer of sortedInitializers) {
    initializer.init(koaApp);
  }

  return koaApp;
};







