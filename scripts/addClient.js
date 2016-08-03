const clientTitle = process.env.CLIENT_TITLE;
const redirectUri = process.env.CLIENT_REDIRECT;
const shiphold = require('ship-hold');
const extensions = require('ship-hold-extension-loader');
const config = require('conf-load')();
const crypto = require('crypto');

const sh = shiphold('db');
extensions(sh);

if (!clientTitle || !redirectUri) {
  throw new Error('CLIENT_TITLE and CLIENT_REDIRECT are mandatory env var');
}

sh.model('Clients')
  .insert({
    title: clientTitle,
    redirectUrl: redirectUri,
    secret: crypto.createRandomBytes(24).toString('base64'),
    format: 'confidential'
  })
  .run()
  .then(function (res) {
    console.log(res[0]);
    process.exit(0);
  })
  .catch(err=> {
    console.log(err);
    process.exit(1);
  });





