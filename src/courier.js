import fetch from 'isomorphic-fetch';

// return error after retries
export const MAX_RETRIES = 5;

export default class Courier {
  constructor(uri) {
    this._uri = uri;
  }

  send(data) {
    return new Promise((resolve, reject) => {
      let retries = 0;
      let body;

      try {
        body = JSON.stringify(data);
      } catch (e) {
        reject(e);
      }

      // try to send data to the server
      // check retry limit before trying
      const attempt = () => {
        if (retries++ >= MAX_RETRIES) {
          reject(new Error('reached maximum retry limit'));
          return;
        }

        // backoff 0, 500, 2000, 4500, 8000, ...
        const millis = 500 * Math.pow(retries, 2);

        setTimeout(() => {
          fetch(this._uri, {method: 'POST', body})
            .then(validate)
            .catch(attempt);
        }, millis);
      };

      // validate response from the server
      // if necessary, try sending again
      const validate = res => {
        if (res.status === 200) {
          res.json().then(resolve);
        } else if (res.status >= 400 && res.status < 500) {
          reject(new Error('failed by client error: ' + res.status));
        } else {
          attempt();
        }
      };

      attempt();
    });
  }
}
