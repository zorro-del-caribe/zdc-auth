module.exports = function (h) {
  return {
    table: 'clients',
    columns: {
      id: 'uuid',
      type: {
        type: 'enum',
        values: ['confidential', 'public']
      },
      redirectUrl: {
        type: 'string',
        format: 'url'
      },
      secret: {
        type: 'string'
      },
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      title: 'string'
    },
    relations: {
      grants: h.hasMany('Grants'),
      authorizationCodes: h.hasMany('AuthorizationCodes'),
      tokens: h.hasMany('Tokens')
    }
  };
};