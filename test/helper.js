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
          secret: "WK5TVHSg7x51ifPQ+uyKCtzgnWz9FqmO",
          type: 'confidential'
        })
        .run()
        .then(function ([client]) {
          return Clients
            .update()
            .set('id', 'd782d313-0811-493e-a760-066dc83bb548')
            .where('id', client.id)
            .run()
            .then(function ([client]) {
              return client;
            })
        })
        .catch(e=>console.log(e));
    });
};