exports.default = {
  hostname: process.env.POSTGRES_HOST || '192.168.99.100',
  username: process.env.POSTGRES_USER || 'docker',
  password: process.env.POSTGRES_PASSWORD || 'docker',
  database: process.env.POSTGRES_DB || 'zdc-auth-test'
};


exports.test = {};

exports.staging = {};

exports.production = {};