const tokenIssuer = require('../lib/tokenIssuers');
const auth = require('../middlewares/basicAuth');
const logger = require('../lib/logger.js');
const moment = require('moment');

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
    const newToken = yield* issuer.issueToken(client);
    yield issuer.revokeOldTokens(newToken);

    this.set('Cache-Control', 'no-store');
    this.set('Pragma', 'no-cache');

    this.body = {
      access_token: newToken.token,
      token_type: "Bearer",
      expires_in: this.app.context.conf.value('server.tokenExpiration'),
      refresh_token: newToken.refreshToken.token
    };

    if (newToken.scope && newToken.scope.target) {
      this.body.user_email = newToken.scope.target;
    }

  }
};

exports.get = {
  method: 'get',
  path: '/:tokenCode',
  schema: {
    type: 'object',
    properties: {
      token: {type: 'string'}
    },
    required: ['tokenCode']
  },
  handler: [auth(), function * (next) {
    const {Tokens, conf} = this.app.context;

    const [token] = yield Tokens
      .select('scope', 'createdAt', 'id', 'revoked', 'token', 'clientId')
      .where('token', '$token')
      .run({token: this.params.tokenCode});

    this.assert(token, 404, 'could not find the requested token');

    if (token.clientId !== this.state.client.id) {
      this.throw(403, 'this client can not access this token');
    }

    const createdAtMoment = moment(token.createdAt);
    const diff = moment().diff(createdAtMoment, 'seconds');

    const expires_in = createdAtMoment
      .add(conf.value('server.tokenExpiration'), 'seconds')
      .diff(moment(), 'seconds');

    this.body = {
      id: token.id,
      scope: token.scope,
      revoked: token.revoked,
      token: token.token,
      expires_in: Math.max(expires_in, 0)
    };
  }]
};