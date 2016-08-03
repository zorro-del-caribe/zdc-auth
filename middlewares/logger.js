module.exports = function (options = {}) {
  const {logger} = Object.assign({}, {logger: console}, options);
  return function * (next) {
    const start = Date.now();
    try {
      yield next;
    } catch (e) {
      const status = e.status || 500;
      this.status = status;
      if (status === 500) {
        logger.error(e)
      } else {
        this.body = {error: e.message || 'unknown error', error_description: e.error_description || 'no description'};
      }
    } finally {
      const elapsed = Date.now() - start;
      const {method, url, ip} = this.request;
      const status = this.status;
      const referrer = this.get('Referer') || '-';
      const logLine = [status, (this.body && this.body.error) || '-', method, [elapsed, 'ms'].join(' '), url, ip, referrer].join(' | ');
      logger.log(logLine);
    }
  }
};