const url = require('url');

function checkValidUrl (uri, client = {}) {
  if (typeof uri !== 'string' || !uri) {
    return false;
  } else {
    const decodedUri = decodeURIComponent(uri);
    const {protocol, slashes, hostname, pathname} = url.parse(decodedUri);
    const isValid = (protocol === 'http:' || protocol === 'https:') && slashes && hostname && pathname;
    return isValid && client.redirectUrl === decodedUri;
  }
}

const InvalidGrantType = {
  validate(){
    return {error: 'invalid_request', message: 'invalid response_type'};
  }
};

const AuthorizationCodeGrant = {
  validate (){
    if (!this.ctx.request.query.client_id) {
      return {message: 'missing client_id', error: 'invalid_request'};
    }

    if (!this.client) {
      return {message: 'unknown client', error: 'invalid_request'};
    }

    if (!checkValidUrl(this.ctx.request.query.redirect_uri, this.client)) {
      return {message: 'missing or invalid redirect_uri', error: 'invalid_request'};
    }

    if (!this.ctx.request.query.state) {
      return {message: 'missing state', error: 'invalid_request', redirect: true};
    }

    return null;
  },
  buildSuccessRedirectUri(baseUrl){
    return baseUrl;
  },
  buildFailureRedirectUri(baseUrl, error = {}){
    const redirectUri = url.parse(baseUrl, true);
    redirectUri.query = {};
    if (this.ctx.request.query.state) {
      redirectUri.query.state = this.ctx.request.query.state;
    }
    redirectUri.query.error = error.error;
    redirectUri.query.error_description = error.message || encodeURIComponent('no error description provided');
    return url.format(redirectUri);
  }
};

module.exports = function (koaCtx, client = null) {
  const {response_type} = koaCtx.request.query;
  switch (response_type) {
    case 'code':
      return Object.assign(Object.create(AuthorizationCodeGrant), {ctx: koaCtx}, {client});
    default:
      return Object.assign(Object.create(InvalidGrantType), {ctx: koaCtx}, {client});
  }
};