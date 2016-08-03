module.exports = function (h) {
  return {
    table: 'refresh_tokens',
    columns: {
      id: 'uuid',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      token: 'string',
      tokenId: 'uuid',
      revoked:'boolean'
    },
    relations: {
      token: h.belongsTo('Tokens', 'tokenId')
    }
  };
};