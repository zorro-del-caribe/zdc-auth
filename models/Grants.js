module.exports = function (h) {
  return {
    table: 'grants',
    columns: {
      id: 'uuid',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      state: 'string',
      clientId: 'uuid',
      ip: 'string',
      consumed: 'boolean'
    },
    relations: {
      client: h.belongsTo('Clients', 'clientId'),
      magicLinks: h.hasOne('MagicLinks')
    }
  }
};