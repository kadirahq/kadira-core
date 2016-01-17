import request from 'request';
import Clock from './clock.js';
import retry from './retry.js';
import {ByPassRetryError} from './retry.js';
import debug from 'debug';

const logger = debug('kadira-core:transport');

const DEFAULTS = {
  appId: '',
  appSecret: '',
  endpoint: 'https://enginex.kadira.io',
  hostname: 'localhost',
  clockSyncInterval: 1000 * 60,
  dataFlushInterval: 1000 * 10,
};

// exporting this for if we need to get this as a NPM module.
export class Kadira {
  constructor(_options) {
    this._options = Object.assign({}, DEFAULTS, _options);
    this._headers = {
      'content-type': 'application/json',
      accepts: 'application/json',
      'KADIRA-APP-ID': this._options.appId,
      'KADIRA-APP-SECRET': this._options.appSecret,
    };

    this._clock = new Clock({
      endpoint: this._options.endpoint + '/simplentp/sync',
    });

    this._clockSyncInterval = null;
  }

  connect() {
    logger('connecting with', this._options);
    return this._checkAuth()
      .then(() => this._clock.sync())
      .then(() => {
        this._clockSyncInterval = setInterval(
          () => this._clock.sync(),
          this._options.clockSyncInterval
        );
      });
  }

  disconnect() {
    logger('disconnect');
    clearInterval(this._clockSyncInterval);
  }

  getJob(id) {
    const body = {action: 'get', params: {}};
    Object.assign(body.params, {id});

    const url = this._options.endpoint + '/jobs';
    const params = {
      body,
      headers: this._headers,
      json: true
    };

    logger('get job', id);
    return this._send(url, params);
  }

  updateJob(id, diff) {
    const body = {action: 'set', params: {}};
    Object.assign(body.params, diff, {id});

    const url = this._options.endpoint + '/jobs';
    const params = {
      body,
      headers: this._headers,
      json: true
    };

    logger('update job', id);
    return this._send(url, params);
  }

  // send the given payload to the server
  sendData(_payload) {
    const payload = {
      ..._payload,
      host: this._options.hostname
    };

    const url = this._options.endpoint;
    const body = JSON.stringify(payload);
    const params = {
      body,
      headers: this._headers,
    };

    logger(`send data - ${body.substr(0, 50)}...`);
    return this._send(url, params);
  }

  // ping the server to check whether appId and appSecret
  // are valid and correct. Data sent inside http headers.
  _checkAuth() {
    const uri = this._options.endpoint + '/ping';
    const params = {headers: this._headers};
    return this._send(uri, params);
  }

  // communicates with the server with http (using fetch)
  // Also handles response http status codes and  retries
  _send(url, params) {
    return retry(() => {
      return new Promise((resolve, reject) => {
        request.post(url, params, (err, res, body) => {
          if (err) {
            return reject(err);
          }

          if (res.statusCode === 200) {
            return resolve(body);
          }

          if (res.statusCode === 401) {
            logger('Error: Unauthorized');
            return reject(new ByPassRetryError('Unauthorized'));
          }

          if (res.statusCode >= 400 && res.statusCode < 500) {
            const message = `Agent Error: ${res.statusCode}`;
            logger(`Error: ${message}`);
            return reject(new ByPassRetryError(message));
          }

          const message = `Request failed: ${res.statusCode}`;
          logger(`Error: ${message}`);
          reject(new Error(message));
        });
      });
    });
  }
}

export default Kadira;
