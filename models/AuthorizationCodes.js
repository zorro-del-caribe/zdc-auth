module.exports = function (h) {
  return {
    table: 'authorization_codes',
    columns: {
      id: 'uuid',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      code: 'string',
      clientId: 'uuid'
    },
    relations: {
      client: h.belongsTo('Clients', 'clientId'),
      token: h.hasOne('Tokens')
    }
  };
};