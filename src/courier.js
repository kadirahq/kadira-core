import Promise from 'bluebird';

import request from 'request';
const post = Promise.promisify(request.post, {multiArgs: true});

class Courier {
  constructor(options) {
    this._options = {
      json: true,
      uri: options.endpoint,
      headers: options.headers,
    };
  }

  post(uri, body) {
    const options = Object.assign({}, this._options, {body});
    return post(options);
  }
}

export default {
  Courier,
};
