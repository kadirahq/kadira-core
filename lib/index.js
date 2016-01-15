import fetch from 'isomorphic-fetch';
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
      'kadira-app-id': this._options.appId,
      'kadira-app-secret': this._options.appSecret,
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

  updateJob(id, diff) {
    logger('update job', id);
    const data = {action: 'set', params: {}};
    Object.assign(data.params, diff, {id});

    const uri = this._options.endpoint + '/jobs';
    const body = JSON.stringify(data);
    const params = {
      body,
      method: 'POST',
      headers: this._headers,
    };

    return this._send(uri, params)
      .then(res => res.json());
  }

  // send the given payload to the server
  sendData(_payload) {
    const payload = {
      ..._payload,
      host: this._options.hostname
    };

    const uri = this._options.endpoint;
    const body = JSON.stringify(payload);
    const params = {
      body,
      method: 'POST',
      headers: this._headers,
    };

    logger(`send data - ${body.substr(0, 50)}...`);
    return this._send(uri, params);
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
  _send(uri, params) {
    return retry(() => {
      return fetch(uri, params).then(res => {
        if (res.status === 200) {
          return res;
        }

        if (res.status === 401) {
          logger('Error: Unauthorized');
          throw new ByPassRetryError('Unauthorized');
        }

        if (res.status >= 400 && res.status < 500) {
          const message = `Agent Error: ${res.status}`;
          logger(`Error: ${message}`);
          throw new ByPassRetryError(message);
        }

        const message = `Request failed: ${res.status}`;
        logger('Error: ${message}');
        throw new Error(message);
      });
    });
  }
}

export default Kadira;
