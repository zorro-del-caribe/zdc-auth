const zdc = require('zdc')();

module.exports = {
  priority: 500,
  init(app){
    const {Tokens, Clients, conf}=app.context;
    const mailerConf = conf.value('mailer');
    app.context.mailer = zdc.mails(mailerConf);
  }
};