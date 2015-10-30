import fetch from 'isomorphic-fetch';

// time sync interval in millis
export const SYNC_INTERVAL = 3e5;

// return error after retries
export const MAX_RETRIES = 5;

export default class Clock {
  constructor(uri) {
    this._uri = uri;
    this._diff = 0;
    this.ready = false;

    this.sync();
    setInterval(() => this.sync(), SYNC_INTERVAL);
  }

  getTime() {
    // Get current time on Kadira server
    return this.clientTS() + this._diff;
  }

  fixTime(clientTS) {
    // Convert client time to server time
    return clientTS + this._diff;
  }

  clientTS() {
    // Get client timestamp while considering time related
    // libraries messing up the Date object. "Y U DO THIS?"
    let now = Date.now();
    if (typeof now === 'number') {
      return now;
    }

    // some time related libraries screw up Date.now()
    // and it returns a Date object instead of a number
    if (now instanceof Date) {
      return now.getTime();
    }

    // final attempt to get time
    return new Date().getTime();
  }

  sync() {
    // This will update the time difference between client
    // and Kadira servers. Retries the update if necessary.
    return new Promise((resolve, reject) => {
      let retries = 0;
      let startTS;

      // try get the timestamp from server
      // check retry limit before trying
      const attempt = () => {
        if (retries++ >= MAX_RETRIES) {
          reject(new Error('reached maximum retry limit'));
          return;
        }

        // backoff 0, 500, 2000, 4500, 8000, ...
        const millis = 500 * Math.pow(retries, 2);

        setTimeout(() => {
          // record starting time
          startTS = this.clientTS();

          fetch(this._uri)
            .then(update)
            .catch(attempt);
        }, millis);
      };

      // validate response from the server
      // if necessary, try requesting again
      const update = res => {
        if (retries === 0) {
          // Cache DNS records before getting the server time.
          // This is done in order to avoid the lookup time.
          // which can affect time difference calculations.
          attempt();
          return;
        }

        if (res.status === 200) {
          res.text().then(timestamp => {
            const serverTS = parseInt(timestamp, 10);
            const resTime = (this.clientTS() - startTS) / 2;
            this._diff = serverTS - resTime - startTS;
            this.ready = true;
            resolve();
          });
        } else if (res.status >= 400 && res.status < 500) {
          // No idea when this can occur, but handling it anyways.
          reject(new Error('failed by client error: ' + res.status));
        } else {
          attempt();
        }
      };

      attempt();
    });
  }
}
