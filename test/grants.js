const test = require('tape');
const request = require('supertest');
const appFactory = require('../app');
const helper = require('./helper');

test('response_type "code": render login page if everything is valid', t=> {
  const app = appFactory();
  app.start()
    .then(helper.createClient)
    .then(function (client) {
      request(app.server)
        .get(`/grants?client_id=${client.id}&response_type=code&redirect_uri=${encodeURIComponent(client.redirectUrl)}&state=123`)
        .expect(200)
        .end(function (err, res) {
          t.error(err);
          t.equal(res.body.template, 'login', 'Render the login template');
          app.stop();
          t.end(err);
        });
    });
});

test('response_type "code": redirect if state is missing', t=> {
  const app = appFactory();
  app.start()
    .then(helper.createClient)
    .then(function (client) {
      request(app.server)
        .get(`/grants?client_id=${client.id}&response_type=code&redirect_uri=${encodeURIComponent(client.redirectUrl)}`)
        .expect(302)
        .end(function (err, res) {
          t.error(err);
          t.equal(res.header.location,`${client.redirectUrl}?error=invalid_request&error_description=${encodeURIComponent('missing state')}`);
          app.stop();
          t.end(err);
        });
    });
});

test('response_type "code": render caution if any other error', t=>{
  const app = appFactory();
  app.start()
    .then(helper.createClient)
    .then(function (client) {
      request(app.server)
        .get(`/grants?response_type=code&redirect_uri=${encodeURIComponent(client.redirectUrl)}`)
        .expect(400)
        .end(function (err, res) {
          t.error(err);
          t.equal(res.body.template,'caution');
          app.stop();
          t.end(err);
        });
    });
});