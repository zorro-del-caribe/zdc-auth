const app = require('./app')();

app
  .start()
  .catch(err=> {
    console.log(err);
    process.exit(1);
  });