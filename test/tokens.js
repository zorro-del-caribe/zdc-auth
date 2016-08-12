const test = require('tape');
const request = require('supertest');
const helper = require('./helper');
const appFactory = require('../app');
const crypto = require('crypto');

test('get access token', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      const {AuthorizationCodes, MagicLinks} = app.context;
      MagicLinks.insert({
        email: 'foo@bar.com'
      })
        .run()
        .then(function ([ml]) {
          return AuthorizationCodes
            .insert({
              code: 'secretcode',
              clientId: client.id,
              magicLinkId: ml.id
            })
            .run()
        })
        .then(function ([ac]) {
          request(app.server)
            .post('/tokens')
            .auth(client.id, client.secret)
            .send('grant_type=authorization_code')
            .send(`code=${ac.code}`)
            .send(`redirect_uri=${encodeURIComponent(client.redirectUrl)}`)
            .expect(200)
            .end(function (err, res) {
              t.error(err);
              t.equal(res.header['cache-control'], 'no-store');
              t.equal(res.header['pragma'], 'no-cache');
              t.ok(res.body.access_token);
              t.ok(res.body.refresh_token);
              t.equal(res.body.expires_in, 3600 * 24 * 15);
              t.equal(res.body.token_type, 'Bearer');
              t.equal(res.body.user_email, 'foo@bar.com');
              app.stop();
              t.end();
            });
        })
    })
    .catch(err=>console.log(err));
});

test('revoke older tokens(authorization codes)', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      const {AuthorizationCodes, MagicLinks, Tokens} = app.context;
      MagicLinks.insert({
        email: 'foo@bar.com'
      })
        .run()
        .then(function ([ml]) {
          return AuthorizationCodes
            .insert({
              code: 'secretcode',
              clientId: client.id,
              magicLinkId: ml.id
            })
            .run()
            .then(function ([ac]) {
              return Tokens
                .insert({
                  clientId: client.id,
                  scope: {type: 'user', target: 'foo@bar.com'}
                })
                .run()
                .then(function () {
                  return ac;
                })
            });
        })
        .then(function (ac) {
          request(app.server)
            .post('/tokens')
            .auth(client.id, client.secret)
            .send('grant_type=authorization_code')
            .send(`code=${ac.code}`)
            .send(`redirect_uri=${encodeURIComponent(client.redirectUrl)}`)
            .expect(200)
            .end(function (err, res) {
              t.error(err);
              t.equal(res.header['cache-control'], 'no-store');
              t.equal(res.header['pragma'], 'no-cache');
              t.ok(res.body.access_token);
              t.ok(res.body.refresh_token);
              t.equal(res.body.expires_in, 3600 * 24 * 15);
              t.equal(res.body.token_type, 'Bearer');
              Tokens
                .select()
                .where('clientId', client.id)
                .and('scope', '@>', {type: 'user', target: 'foo@bar.com'})
                .and('revoked', false)
                .run()
                .then(function (tokens) {
                  t.equal(tokens.length, 1);
                  app.stop();
                  t.end();
                });
            });
        })
    })
    .catch(err=>console.log(err));
});

test('get access token unauthenticated client', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      const {AuthorizationCodes} = app.context;
      AuthorizationCodes
        .insert({
          code: 'secretcode',
          clientId: client.id
        })
        .run()
        .then(function ([ac]) {
          request(app.server)
            .post('/tokens')
            .auth(client.id, 'foo')
            .send('grant_type=authorization_code')
            .send(`code=${ac.code}`)
            .send(`redirect_uri=${encodeURIComponent(client.redirectUrl)}`)
            .expect(401)
            .end(function (err, res) {
              t.error(err);
              t.equal(res.body.error, 'invalid_client');
              app.stop();
              t.end();
            });
        })
    })
    .catch(err=>console.log(err));
});

test('get access token: invalid grant', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      const {AuthorizationCodes} = app.context;
      AuthorizationCodes
        .insert({
          code: 'secretcode',
          clientId: client.id,
        })
        .run()
        .then(function ([ac]) {
          request(app.server)
            .post('/tokens')
            .auth(client.id, client.secret)
            .send('grant_type=authorization_code')
            .send(`code=whatever`)
            .send(`redirect_uri=${encodeURIComponent(client.redirectUrl)}`)
            .expect(400)
            .end(function (err, res) {
              t.error(err);
              t.equal(res.body.error, 'invalid_grant');
              app.stop();
              t.end();
            });
        })
    })
    .catch(err=>console.log(err));
});

test('get access token (client credentials)', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      request(app.server)
        .post('/tokens')
        .auth(client.id, client.secret)
        .send('grant_type=client_credentials')
        .expect(200)
        .end(function (err, res) {
          t.error(err);
          t.equal(res.header['cache-control'], 'no-store');
          t.equal(res.header['pragma'], 'no-cache');
          t.ok(res.body.access_token);
          t.ok(res.body.refresh_token);
          t.equal(res.body.expires_in, 3600 * 24 * 15);
          t.equal(res.body.token_type, 'Bearer');
          app.stop();
          t.end();
        });
    })
    .catch(err=>console.log(err));
});

test('revoke old tokens (client credentials', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      const {Tokens}=app.context;
      return Tokens
        .insert({
          clientId: client.id,
          token: 'whatever',
          grantType: 'client_credentials',
          scope: {type: 'app'}
        })
        .run()
        .then(function () {
          return client;
        });
    })
    .then(function (client) {
      request(app.server)
        .post('/tokens')
        .auth(client.id, client.secret)
        .send('grant_type=client_credentials')
        .expect(200)
        .end(function (err, res) {
          t.error(err);
          t.equal(res.header['cache-control'], 'no-store');
          t.equal(res.header['pragma'], 'no-cache');
          t.ok(res.body.access_token);
          t.ok(res.body.refresh_token);
          t.equal(res.body.expires_in, 3600 * 24 * 15);
          t.equal(res.body.token_type, 'Bearer');
          const {Tokens} = app.context;
          Tokens
            .select()
            .where('clientId', client.id)
            .and('revoked', false)
            .and('scope', '@>', {type: 'app'})
            .run()
            .then(function (tokens) {
              t.equal(tokens.length, 1);
              app.stop();
              t.end();
            });
        });
    })
    .catch(err=>console.log(err));
});

test('fail at get access token (client credentials): invalid credentials', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      request(app.server)
        .post('/tokens')
        .auth(client.id, 'woot')
        .send('grant_type=client_credentials')
        .expect(401)
        .end(function (err, res) {
          t.error(err);
          t.equal(res.body.error, 'invalid_client');
          app.stop();
          t.end();
        });
    })
    .catch(err=>console.log(err));
});

test('get access token from a refresh token', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      const {Tokens, RefreshTokens} = app.context;
      return Tokens
        .insert({
          clientId: client.id,
          token: crypto.randomBytes(32).toString('hex'),
          grantType: 'client_credentials'
        })
        .run()
        .then(function ([token]) {
          return RefreshTokens
            .insert({
              tokenId: token.id,
              token: crypto.randomBytes(32).toString('hex')
            })
            .run()
        })
        .then(function ([refreshToken]) {
          return {client, refreshToken};
        });
    })
    .then(function ({client, refreshToken}) {
      request(app.server)
        .post('/tokens')
        .auth(client.id, client.secret)
        .send('grant_type=refresh_token')
        .send(`refresh_token=${refreshToken.token}`)
        .expect(200)
        .end(function (err, res) {
          t.error(err);
          t.equal(res.header['cache-control'], 'no-store');
          t.equal(res.header['pragma'], 'no-cache');
          t.ok(res.body.access_token);
          t.ok(res.body.refresh_token);
          t.equal(res.body.expires_in, 3600 * 24 * 15);
          t.equal(res.body.token_type, 'Bearer');
          app.stop();
          t.end();
        });
    })
    .catch(err=>console.log(err));
});

test('get access token from a refresh token fails due to wrong client credentials', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      const {Tokens, RefreshTokens} = app.context;
      return Tokens
        .insert({
          clientId: client.id,
          token: crypto.randomBytes(32).toString('hex'),
          grantType: 'client_credentials'
        })
        .run()
        .then(function ([token]) {
          return RefreshTokens
            .insert({
              tokenId: token.id,
              token: crypto.randomBytes(32).toString('hex')
            })
            .run()
        })
        .then(function ([refreshToken]) {
          return {client, refreshToken};
        });
    })
    .then(function ({client, refreshToken}) {
      request(app.server)
        .post('/tokens')
        .auth(client.id, 'foo')
        .send('grant_type=refresh_token')
        .send(`refresh_token=${refreshToken.token}`)
        .expect(401)
        .end(function (err, res) {
          t.error(err);
          t.equal(res.body.error, 'invalid_client');
          app.stop();
          t.end();
        });
    })
    .catch(err=>console.log(err));
});

test('get access token from a refresh token fails due to wrong refreshToken', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      const {Tokens, RefreshTokens} = app.context;
      return Tokens
        .insert({
          clientId: client.id,
          token: crypto.randomBytes(32).toString('hex'),
          grantType: 'client_credentials',
          scope: `'${JSON.stringify({type: 'user', target: 'foo@bar.com'})}'`
        })
        .run()
        .then(function ([token]) {
          return RefreshTokens
            .insert({
              tokenId: token.id,
              token: crypto.randomBytes(32).toString('hex')
            })
            .run()
        })
        .then(function ([refreshToken]) {
          return {client, refreshToken};
        });
    })
    .then(function ({client, refreshToken}) {
      request(app.server)
        .post('/tokens')
        .auth(client.id, client.secret)
        .send('grant_type=refresh_token')
        .send(`refresh_token=adslfkjad`)
        .expect(400)
        .end(function (err, res) {
          t.error(err);
          t.equal(res.body.error, 'invalid_grant');
          app.stop();
          t.end();
        });
    })
    .catch(err=>console.log(err));
});

test('get access token from a refresh token fails due to revoked token', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      const {Tokens, RefreshTokens} = app.context;
      return Tokens
        .insert({
          clientId: client.id,
          token: crypto.randomBytes(32).toString('hex'),
          grantType: 'client_credentials'
        })
        .run()
        .then(function ([token]) {
          return RefreshTokens
            .insert({
              tokenId: token.id,
              token: crypto.randomBytes(32).toString('hex'),
              revoked: true
            })
            .run()
        })
        .then(function ([refreshToken]) {
          return {client, refreshToken};
        });
    })
    .then(function ({client, refreshToken}) {
      request(app.server)
        .post('/tokens')
        .auth(client.id, client.secret)
        .send('grant_type=refresh_token')
        .send(`refresh_token=${refreshToken.token}`)
        .expect(400)
        .end(function (err, res) {
          t.error(err);
          t.equal(res.body.error, 'invalid_grant');
          app.stop();
          t.end();
        });
    })
    .catch(err=>console.log(err));
});

test('get token details', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      const {Tokens} = app.context;
      return Tokens
        .insert({
          token: 'foo',
          clientId: client.id,
          scope: {whatever: 'foo'}
        })
        .run()
        .then(function ([token]) {
          return {token, client};
        });
    })
    .then(function ({token, client}) {
      request(app.server)
        .get(`/tokens/${token.token}`)
        .auth(client.id, client.secret)
        .expect(200)
        .end(function (err, result) {
          t.error(err);
          t.deepEqual(result.body.scope, {whatever: 'foo'});
          t.equal(result.body.token, token.token);
          t.ok(result.body.expires_in > 0);
          app.stop();
          t.end();
        });
    })
    .catch(err=>console.log(err));
});

test('get token details fails as token does not belong to client', t=> {
  const app = appFactory();
  app
    .start()
    .then(helper.createClient)
    .then(function (client) {
      const {Clients, Tokens} = app.context;
      return Clients
        .insert({
          type: 'confidential',
          title: 'other client'
        })
        .run()
        .then(function ([otherClient]) {
          return Tokens
            .insert({
              token: 'foobis',
              clientId: otherClient.id,
              scope: {whatever: 'foo'}
            })
            .run()
            .then(function ([token]) {
              return {token, client};
            });
        });
    })
    .then(function ({token, client}) {
      request(app.server)
        .get(`/tokens/${token.token}`)
        .auth(client.id, client.secret)
        .expect(403)
        .end(function (err, result) {
          t.error(err);
          app.stop();
          t.end();
        });
    })
    .catch(err=>console.log(err));
});