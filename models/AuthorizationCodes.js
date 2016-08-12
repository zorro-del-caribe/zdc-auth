module.exports = function (h) {
  return {
    table: 'authorization_codes',
    columns: {
      id: 'uuid',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      code: 'string',
      clientId: 'uuid',
      magicLinkId: 'uuid'
    },
    relations: {
      client: h.belongsTo('Clients', 'clientId'),
      magicLink: h.belongsTo('MagicLinks', 'magicLinkId'),
      token: h.hasOne('Tokens')
    }
  };
};