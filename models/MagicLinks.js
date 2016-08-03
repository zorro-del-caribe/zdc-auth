module.exports = function (h) {
  return {
    table: 'magic_links',
    columns: {
      id: 'uuid',
      email: 'string',
      createdAt: 'timestamp',
      updatedAt:'timestamp',
      token: 'string',
      grantId: 'uuid',
      consumed:'boolean'
    },
    relations: {
      grant: h.belongsTo('Grants', 'grantId')
    }
  }
};