const test = require('tape');
const appFactory = require('../app');
const helper = require('./helper');
const request = require('supertest');
const url = require('url');
const uuid = require('node-uuid');

test('request magic link', t=> {
  const app = appFactory();
  app.start()
    .then(helper.createClient)
    .then(function (client) {
      const {Grants} = app.context;
      return Grants
        .insert({state: '123', clientId: client.id})
        .run();
    })
    .then(function ([grant]) {
      request(app.server)
        .post('/magicLinks')
        .send('email=test@example.com')
        .send(`grantId=${grant.id}`)
        .expect(200)
        .end(function (err, res) {
          t.error(err);
          t.equal(res.body.template, 'sentEmail');
          t.equal(res.body.locals.email, 'test@example.com');
          app.stop();
          t.end(err);
        });
    })
    .catch(err=>console.log(err))
});

test('request magic link with invalid grant', t=> {
  const app = appFactory();
  app.start()
    .then(helper.createClient)
    .then(function (client) {
      const {Grants} = app.context;
      return Grants
        .insert({state: '123', clientId: client.id, consumed: true})
        .run();
    })
    .then(function ([grant]) {
      request(app.server)
        .post('/magicLinks')
        .send('email=test@example.com')
        .send(`grantId=${grant.id}`)
        .expect(422)
        .end(function (err, res) {
          t.error(err);
          app.stop();
          t.end(err);
        });
    })
    .catch(err=>console.log(err))
});

test('validate magic link', t=> {
  const app = appFactory();
  app.start()
    .then(helper.createClient)
    .then(function (client) {
      const {Grants} = app.context;
      return Grants
        .insert({state: '123', clientId: client.id})
        .run()
        .then(function ([grant]) {
          const {MagicLinks} = app.context;

          return MagicLinks
            .insert({
              email: 'foo@example.com',
              token: 'randomtoken',
              grantId: grant.id
            })
            .run();
        })
        .then(function ([ml]) {
          request(app.server)
            .get(`/magicLinks/${ml.id}?token=randomtoken`)
            .expect(302)
            .end(function (err, res) {
              t.error(err);
              const redirect = url.parse(res.header.location, true);
              const clientUri = url.parse(client.redirectUrl, true);
              t.equal(redirect.query.state, '123');
              t.equal(redirect.host, clientUri.host);
              t.equal(redirect.pathname, clientUri.pathname);
              t.ok(redirect.query.code);
              app.stop();
              t.end(err);
            });
        });
    })
    .catch(err=>console.log(err));
});

test('fail validate magic link', t=> {
  const app = appFactory();
  app.start()
    .then(helper.createClient)
    .then(function (client) {
      const {Grants} = app.context;
      return Grants
        .insert({state: '123', clientId: client.id})
        .run()
        .then(function ([grant]) {
          const {MagicLinks} = app.context;

          return MagicLinks
            .insert({
              email: 'foo@example.com',
              token: 'randomtoken',
              grantId: grant.id,
              consumed: true
            })
            .run();
        })
        .then(function ([ml]) {
          request(app.server)
            .get(`/magicLinks/${ml.id}?token=randomtoken`)
            .expect(422)
            .end(function (err, res) {
              t.error(err);
              app.stop();
              t.end();
            });
        });
    })
    .catch(err=>console.log(err));
});

test('fail validate magic link (invalid token)', t=> {
  const app = appFactory();
  app.start()
    .then(helper.createClient)
    .then(function (client) {
      const {Grants} = app.context;
      return Grants
        .insert({state: '123', clientId: client.id})
        .run()
        .then(function ([grant]) {
          const {MagicLinks} = app.context;

          return MagicLinks
            .insert({
              email: 'foo@example.com',
              token: 'randomtoken',
              grantId: grant.id
            })
            .run();
        })
        .then(function ([ml]) {
          request(app.server)
            .get(`/magicLinks/${ml.id}?token=wrongtoken`)
            .expect(422)
            .end(function (err, res) {
              t.error(err);
              app.stop();
              t.end();
            });
        });
    })
    .catch(err=>console.log(err));
});

test('fail validate magic link (can not find magic link)', t=> {
  const app = appFactory();
  app.start()
    .then(helper.createClient)
    .then(function (client) {
      const {Grants} = app.context;
      return Grants
        .insert({state: '123', clientId: client.id})
        .run()
        .then(function ([grant]) {
          const {MagicLinks} = app.context;

          return MagicLinks
            .insert({
              email: 'foo@example.com',
              token: 'randomtoken',
              grantId: grant.id
            })
            .run();
        })
        .then(function ([ml]) {
          request(app.server)
            .get(`/magicLinks/${uuid.v4()}?token=randomtoken`)
            .expect(404)
            .end(function (err, res) {
              t.error(err);
              app.stop();
              t.end();
            });
        });
    })
    .catch(err=>console.log(err));
});

