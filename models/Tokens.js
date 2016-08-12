module.exports = function (h) {
  return {
    table: 'tokens',
    columns: {
      id: 'uuid',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      token: 'string',
      clientId: 'uuid',
      authorizationCodeId: 'uuid',
      revoked: 'boolean',
      grantType: {
        type: {
          type: 'enum',
          values: ['authorization_code', 'client_credentials', 'refresh_token']
        },
      },
      scope: 'jsonb'
    },
    relations: {
      client: h.belongsTo('Clients', 'clientId'),
      code: h.belongsTo('AuthorizationCodes', 'authorizationCodeId'),
      refreshTokens: h.hasOne('RefreshTokens')
    }
  };
};