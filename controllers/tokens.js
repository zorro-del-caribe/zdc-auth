const tokenIssuer = require('../lib/tokenIssuers');
const logger = require('../lib/logger.js');

exports.create = {
  method: 'post',
  path: '/',
  schema: {
    title: 'get access token',
    type: 'object',
    properties: {
      grant_type: {
        enum: ['authorization_code', 'client_credentials', 'refresh_token']
      }
    },
    required: ['grant_type']
  },
  handler: function * () {
    const issuer = tokenIssuer(this);
    const client = yield* issuer.validateClient();
    const token = yield* issuer.issueToken(client);

    this.set('Cache-Control', 'no-store');
    this.set('Pragma', 'no-cache');

    this.body = {
      access_token: token.token,
      token_type: "Bearer",
      expires_in: this.app.context.conf.value('server.tokenExpiration'),
      refresh_token: token.refreshToken.token
    };

  }
};