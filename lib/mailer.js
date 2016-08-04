module.exports = function (options) {
  return {
    send(emailAddress, magicLink){
      console.log(`http://localhost:3000/magicLinks/${magicLink.id}?token=${magicLink.token}`);
      return new Promise(function (resolve, reject) {
        resolve();
      });
    }
  };
};