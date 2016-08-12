const url = require('url');
const grants = require('../lib/grants');
const logger = require('../lib/logger');
const crypto = require('crypto');

// we do not redirect in case of server error (500)
exports.prompt = {
  method: 'get',
  path: '/',
  handler: function * (next) {
    const query = this.request.query;
    const {Clients, Grants} = this.app.context;
    const client_id = query.client_id;

    const [client] = yield Clients
      .select('id', 'redirectUrl')
      .where('id', '$client_id')
      .run({client_id});

    const granter = grants(this, client);
    const validationError = granter.validate();

    if (validationError === null) {
      const [grant] = yield Grants
        .insert({state: '$state', clientId: client.id, ip: this.request.ip})
        .run(this.query);
      this.render('login', {grant});
    } else {
      logger.error(validationError);
      if (validationError.redirect === true) {
        const redirectUri = granter.buildFailureRedirectUri(query.redirect_uri, validationError);
        this.redirect(redirectUri);
      } else {
        this.status = 400;
        this.render('caution');
      }
    }
  }
};