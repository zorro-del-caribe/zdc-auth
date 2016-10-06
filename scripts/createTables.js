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
      INSERT INTO clients (id, secret, type, "redirectUrl",title) VALUES ('af19c093-3ac6-4a10-83fb-bb96d0906d27','88501fa7bd1b73eff81deeef028aeb9d','confidential','http://localhost:4000/authentications/callback','test app');
      INSERT INTO clients (id, secret, type, "redirectUrl",title) VALUES ('d782d313-0811-493e-a760-066dc83bb548','WK5TVHSg7x51ifPQ+uyKCtzgnWz9FqmO','confidential','https://app.zdc.local/authentications/callback','zdc web app');
      INSERT INTO clients (id, secret, type,title) VALUES ('209b18b1-1f44-42e5-9c71-636e596e5d13','0c33f9c8f05362d5e1791ab9c3870fb5','confidential','zdc api');
      INSERT INTO clients (id, secret, type,title) VALUES ('9c9194bb-4812-49a3-a08b-a78c394ddc86','8c9b8d513f04a934b8234f039c3d538b','confidential','zdc search');
`, function (err, result) {
      if (err)
        throw err;

      done();
      sh.stop();
    });
  })
  .catch(e=> {
    console.log(e);
    process.exit(1);
  });