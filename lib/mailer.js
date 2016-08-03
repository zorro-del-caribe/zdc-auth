module.exports = function (options) {
  return {
    send(emailAddress, magicLink){
      //todo
      console.log(magicLink);
      return new Promise(function (resolve, reject) {
        resolve();
      });
    }
  };
};