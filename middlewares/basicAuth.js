const auth = require('basic-auth');

module.exports = function () {
  return function* (next) {
    const {Clients} = this.app.context;
    const authVals = auth(this);

    if (!authVals) {
      challenge(this);
    }

    const {name:clientId, pass:secret} = auth(this);

    if (!clientId) {
      challenge(this);
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

function challenge (koaCtx) {
  koaCtx.set('WWW-Authenticate', 'Basic');
  koaCtx.throw(401)
}
