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
          redirectUrl: 'http://localhost:4000/authentications/callback',
          secret: "88501fa7bd1b73eff81deeef028aeb9d'",
          type: 'confidential'
        })
        .run()
        .then(function ([client]) {
          return Clients
            .update()
            .set('id', 'af19c093-3ac6-4a10-83fb-bb96d0906d27')
            .where('id', client.id)
            .run()
            .then(function ([client]) {
              return client;
            })
        })
        .catch(e=>console.log(e));
    });
};