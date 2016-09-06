if (process.env.NODE_ENV === 'production') {
  throw new Error('running script in production mode');
}

const shipHold = require('ship-hold');
const conf = require('conf-load')();

const sh = shipHold(conf.value('db'));

sh.getConnection()
  .then(function ({client, done}) {
    client.query(`
      DROP TYPE IF EXISTS client_type CASCADE;
      CREATE TYPE client_type AS ENUM ('confidential', 'public');
      DROP TABLE IF EXISTS clients CASCADE;
      CREATE TABLE clients
      (
      id uuid PRIMARY KEY,
      type client_type,
      "redirectUrl" varchar(128),
      secret varchar(32),
      "createdAt" timestamp DEFAULT current_timestamp,
      "updatedAt" timestamp DEFAULT current_timestamp,
      title varchar(128)
      );
      DROP TABLE IF EXISTS grants CASCADE;
      CREATE TABLE grants
      (
      id uuid PRIMARY KEY,
      "createdAt" timestamp DEFAULT current_timestamp,
      "updatedAt" timestamp DEFAULT current_timestamp,
      state varchar(128) NOT NULL,
      "clientId" uuid REFERENCES clients,
       ip varchar,
       consumed boolean DEFAULT false
      );
      DROP TABLE IF EXISTS magic_links CASCADE;
      CREATE TABLE magic_links
      (
      id uuid PRIMARY KEY,
      "createdAt" timestamp DEFAULT current_timestamp,
      "updatedAt" timestamp DEFAULT current_timestamp,
       email varchar(128) NOT NULL,
      "grantId" uuid REFERENCES grants,
       token varchar(128),
       consumed boolean DEFAULT false
      );
      DROP TABLE IF EXISTS authorization_codes CASCADE;
      CREATE TABLE authorization_codes
      (
      id uuid PRIMARY KEY,
      "createdAt" timestamp DEFAULT current_timestamp,
      "updatedAt" timestamp DEFAULT current_timestamp,
      "clientId" uuid REFERENCES clients,
      "magicLinkId" uuid REFERENCES magic_links,
       code varchar(255),
       consumed boolean DEFAULT false
      );
      DROP TABLE IF EXISTS tokens CASCADE;
      DROP TYPE IF EXISTS grant_type CASCADE;
      CREATE TYPE grant_type AS ENUM ('authorization_code', 'client_credentials','refresh_token');
      CREATE TABLE tokens
      (
      id uuid PRIMARY KEY,
      "createdAt" timestamp DEFAULT current_timestamp,
      "updatedAt" timestamp DEFAULT current_timestamp,
      "clientId" uuid REFERENCES clients,
      "authorizationCodeId" uuid REFERENCES authorization_codes,
       token varchar(128),
       "grantType" grant_type,
       revoked boolean DEFAULT false,
       scope jsonb
      );
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      CREATE TABLE refresh_tokens
      (
      id uuid PRIMARY KEY,
      "createdAt" timestamp DEFAULT current_timestamp,
      "updatedAt" timestamp DEFAULT current_timestamp,
      "tokenId" uuid REFERENCES tokens,
       token varchar(128),
       revoked boolean DEFAULT false
      );
      INSERT INTO clients (id, secret, type, "redirectUrl",title) VALUES ('d782d313-0811-493e-a760-066dc83bb548','WK5TVHSg7x51ifPQ+uyKCtzgnWz9FqmO','confidential','http://app.zdc.local/authentications/callback','test app');
`, function (err, result) {
      if (err)
        throw err;

      done();
      sh.stop();
    });
  })
  .catch(e=> {
    throw e;
  });