exports.default = {
  endpoint: {
    protocol: 'http',
    hostname: process.env.MAILER_HOST || 'mailer',
    port: process.env.MAILER_PORT || 5001
  },
  token: 'whatever'
};