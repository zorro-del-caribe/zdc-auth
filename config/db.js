exports.default = {
  hostname: process.env.POSTGRES_HOST || '127.0.0.1',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'docker',
  database: process.env.POSTGRES_DB || 'zdc-auth'
};


exports.test = {
  database:'zdc-test'
};

exports.staging = {};

exports.production = {};