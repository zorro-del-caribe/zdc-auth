const auth = require('basic-auth');
const moment = require('moment');
const crypto = require('crypto');

const BasicClientAuthenticator = {
  * validateClient() {
    const throwErr = () => {
      this.ctx.set('WWW-Authenticate', 'Basic');
      this.ctx.throw(401, 'invalid_client');
    };

    const {Clients} = this.ctx.app.context;
    const {name:client_id, pass:secret} = auth(this.ctx);

    if (!client_id || !secret) {
      throwErr();
    }

    const [client] = yield Clients
      .select('id', 'redirectUrl', 'secret')
      .where('id', '$client_id')
      .run({client_id});

    if (!client || client.secret !== secret) {
      throwErr();
    }

    return client;
  }
};

const TokenRevoker = {
  *revokeOldTokens(newToken){
    const {Tokens} = this.ctx.app.context;
    yield Tokens
      .update()
      .set('revoked', true)
      .where('clientId', '$clientId')
      .and('scope', '@>', newToken.scope || {})
      .and('id', '!=', '$tokenId')
      .run({clientId: newToken.clientId, tokenId: newToken.id});
  }
};

const RefreshTokenIssuer = {
  * issueToken(client){
    const {Tokens, RefreshTokens, conf} = this.ctx.app.context;
    const {refresh_token} = this.ctx.request.body;

    this.ctx.assert(refresh_token, 400, 'invalid_request');

    const [refreshToken] = yield RefreshTokens
      .select('id', 'token', 'tokenId', 'revoked')
      .where('token', '$refresh_token')
      .include(Tokens.select('id', 'clientId', 'createdAt', 'scope', 'revoked'))
      .instances({refresh_token});

    this.ctx.assert(refreshToken, 400, 'invalid_grant');

    if (!isTokenValid(refreshToken)) {
      this.ctx.throw(400, 'invalid_grant');
    }

    const [newToken] = yield Tokens
      .insert({
        clientId: client.id,
        token: crypto.randomBytes(32).toString('hex'),
        grantType: 'refresh_token',
        scope: refreshToken.token.scope
      })
      .run();

    const [newRefreshToken] = yield RefreshTokens
      .insert({
        tokenId: newToken.id,
        token: crypto.randomBytes(32).toString('hex')
      })
      .run();

    return Object.assign(newToken, {refreshToken: newRefreshToken});

    function isTokenValid (refreshToken) {
      const createdAtMomemnt = moment(refreshToken.token.createdAt);
      const diff = moment().diff(createdAtMomemnt, 'seconds');
      return refreshToken.token.clientId === client.id && !refreshToken.token.revoked && !refreshToken.revoked && diff <= conf.value('server.tokenExpiration');
    }
  }
};

const AuthorizationCodeTokenIssuer = {
  * issueToken (client) {
    const {AuthorizationCodes, MagicLinks, Tokens, RefreshTokens}=this.ctx.app.context;
    const {code, redirect_uri}=this.ctx.request.body;

    const [authorizationCode] =  yield AuthorizationCodes
      .select('code', 'createdAt', 'id')
      .where('code', '$code')
      .include(MagicLinks.select('id', 'email'))
      .instances({code: decodeURIComponent(code)});


    this.ctx.assert(authorizationCode, 400, 'invalid_grant');

    //todo something is wrong with date and timezone
    const createdAtMoment = moment(authorizationCode.createdAt);
    const diff = moment().diff(createdAtMoment, 'minutes');

    if (!authorizationCode || diff > 5) {
      this.ctx.throw(400, 'invalid_grant');
    }

    if (client.redirectUrl !== decodeURIComponent(redirect_uri)) {
      this.ctx.throw(400, 'invalid_grant');
    }

    const [token] = yield Tokens
      .insert({
        clientId: client.id,
        token: crypto.randomBytes(32).toString('hex'),
        authorizationCodeId: authorizationCode.id,
        grantType: 'authorization_code',
        scope: {type: 'user', target: authorizationCode.magicLink.email}
      })
      .run();

    const [[refreshToken]] = yield [RefreshTokens
      .insert({
        tokenId: token.id,
        token: crypto.randomBytes(32).toString('hex')
      })
      .run(),
      authorizationCode.save({consumed: true})];

    return Object.assign(token, {refreshToken});
  }
};

const ClientCredentialsTokenIssuer = {
  * issueToken(client){
    const {Tokens, RefreshTokens}=this.ctx.app.context;
    const [token] = yield Tokens
      .insert({
        clientId: client.id,
        token: crypto.randomBytes(32).toString('hex'),
        grantType: 'client_credentials',
        scope: {type: 'app'}
      })
      .run();

    const [refreshToken] = yield RefreshTokens
      .insert({
        tokenId: token.id,
        token: crypto.randomBytes(32).toString('hex')
      })
      .run();

    return Object.assign(token, {refreshToken});
  }
};

module.exports = function (koaCtx) {
  const {grant_type} = koaCtx.request.body;
  switch (grant_type) {
    case 'authorization_code':
      return Object.create(Object.assign(AuthorizationCodeTokenIssuer, BasicClientAuthenticator, TokenRevoker), {ctx: {value: koaCtx}});
    case 'client_credentials':
      return Object.create(Object.assign(ClientCredentialsTokenIssuer, BasicClientAuthenticator, TokenRevoker), {ctx: {value: koaCtx}});
    case 'refresh_token':
      return Object.create(Object.assign(RefreshTokenIssuer, BasicClientAuthenticator, TokenRevoker), {ctx: {value: koaCtx}});
    default:
      koaCtx.throw(400, 'unsupported_grant_type');
  }
};