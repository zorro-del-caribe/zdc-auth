const auth = require('basic-auth');

module.exports = function () {
  return function* (next) {
    const {Clients} = this.app.context;
    const {name:clientId, pass:secret} = auth(this);

    if (!clientId) {
      this.set('WWW-Authenticate', 'Basic');
      this.throw(401)
    }

    const [client] = yield Clients
      .select('id', 'secret', 'title')
      .where('id', '$clientId')
      .run({clientId});

    if (!client || client.secret !== secret) {
      this.throw(401, 'invalid client credentials');
    }

    this.state.client = {id: client.id, title: client.title};
    yield *next;
  };
};