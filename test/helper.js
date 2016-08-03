const crypto = require('crypto');

exports.createClient = function (app) {
  const {Clients} = app.context;
  return Clients
    .select()
    .where('title', 'test app')
    .run()
    .then(function ([client]) {
      return client ? client
        : Clients
        .insert({
          title: 'test app',
          redirectUrl: 'http://localhost:4000/auth',
          secret: crypto.randomBytes(24).toString('base64'),
          type: 'confidential'
        })
        .run()
        .then(function ([client]) {
          return client;
        });
    });
};