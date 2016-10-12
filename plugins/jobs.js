const noauth = require('zdc-client').noauth;

module.exports = {
  priority: 300,
  init(app){
    const {conf} = app.context;
    const endpoint = conf.value('jobs');
    app.context.jobs = noauth({
      schema: {
        sendEmail: {
          path: '/mails',
          method: 'post',
          body: ['template', 'recipient', 'payload']
        }
      },
      namespace: 'jobs',
      endpoint
    });
    return app;
  }
};