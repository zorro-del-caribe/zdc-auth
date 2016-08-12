// request a magic link (posting a email address)
const crypto = require('crypto');
const mailer = require('../lib/mailer')();
const url = require('url');
const moment = require('moment');

exports.requestMagicLink = {
  method: 'post',
  path: '/',
  schema: {
    title: 'MagicLink request',
    description: 'request a magic link',
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email'
      },
      grantId: {
        type: 'string',
        format: 'uuid'
      }
    },
    additionalProperties: false,
    required: ['email', 'grantId']
  },
  handler: function * (next) {
    const {email, grantId} = this.request.body;
    const {MagicLinks, Grants} = this.app.context;

    const [grant] = yield Grants
      .select('id', 'createdAt', 'consumed')
      .where('id', '$grantId')
      .instances({grantId});

    const createdAtMoment = moment(grant.createdAt);
    const diff = moment().diff(createdAtMoment, 'minutes');

    if (!grant || grant.consumed === true || diff >= 15) {
      yield grant.save({consumed: true});
      this.throw(422, 'grant is Invalid');
    }

    const [magicLink] = yield [
      MagicLinks
        .new({email, token: crypto.randomBytes(16).toString('hex'), grantId})
        .create(),
      grant.save({consumed: true})
    ];

    //todo
    yield mailer.send(email, magicLink);

    this.render('sentEmail', {email});
  }
};

//validate magic link
exports.validateMagicLink = {
  method: 'get',
  path: '/:magicLinkId',
  schema: {
    title: 'get MagicLink',
    type: 'object',
    properties: {
      magicLinkId: {
        type: 'string',
        format: 'uuid'
      },
      token: {
        type: 'string'
      }
    },
    additionalProperties: false,
    required: ['magicLinkId', 'token']
  },
  handler: function * () {
    const {magicLinkId} = this.params;
    const {token} = this.request.query;
    const {MagicLinks, Grants, Clients, AuthorizationCodes} =this.app.context;

    const [magicLink] = yield MagicLinks
      .select('id', 'token', 'consumed')
      .where('id', '$magicLinkId')
      .include(Grants.select('id', 'state', 'clientId').include(Clients.select('id', 'redirectUrl')))
      .instances({magicLinkId});

    this.assert(magicLink, 404);

    if (magicLink.consumed === true) {
      this.throw(422, 'magic link has already been consumed');
    }

    //todo check what is wrong with dates and timezones
    const createdAtMoment = moment(magicLink.createdAt);
    const diff = moment().diff(createdAtMoment, 'minutes');

    if (token !== magicLink.token || diff > 5) {
      yield magicLink.save({consumed: true});
      this.throw(422, 'invalid magic link');
    }

    const authorizationCode = yield AuthorizationCodes
      .new({
        clientId: magicLink.grant.clientId,
        code: crypto.randomBytes(24).toString('base64'),
        magicLinkId
      })
      .create();

    yield magicLink.save({consumed: true});

    const redirect = url.parse(magicLink.grant.client.redirectUrl);
    redirect.query = {
      state: magicLink.grant.state,
      code: encodeURIComponent(authorizationCode.code)
    };

    this.redirect(url.format(redirect));
  }
};