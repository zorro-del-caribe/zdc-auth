const shLoader = require('ship-hold-extension-loader');
const shiphold = require('ship-hold');

module.exports = {
  priority: 300,
  init: function (app) {
    const sh = shiphold(app.context.conf.value('db'));
    shLoader(sh);
    for (const model of sh.models()) {
      app.context[model] = sh.model(model)
    }
    app.context.sh = sh;
  }
};