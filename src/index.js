import fetch from 'isomorphic-fetch';
import Clock from './clock.js';
import retry from './retry.js';
import {ERR_ENDRETRY} from './retry.js';

const DEFAULTS = {
  appId: '',
  appSecret: '',
  endpoint: 'https://enginex.kadira.io',
  hostname: 'localhost',
  clockSyncInterval: 1000 * 60,
  dataFlushInterval: 1000 * 10,
};

export default class Kadira {
  constructor(_options) {
    this._options = Object.assign({}, DEFAULTS, _options);
    this._payload = {host: this._options.hostname};
    this._headers = {
      'kadira-app-id': this._options.appId,
      'kadira-app-secret': this._options.appSecret,
    };

    this._clock = new Clock({
      endpoint: this._options.endpoint + '/simplentp/sync',
    });

    this._clockSyncInterval = null;
    this._dataFlushInterval = null;
  }

  connect() {
    return this._checkAuth()
      .then(() => this._clock.sync())
      .then(() => {
        this._clockSyncInterval = setInterval(
          () => this._clock.sync(),
          this._options.clockSyncInterval
        );

        this._dataFlushInterval = setInterval(
          () => this._flushData(),
          this._options.dataFlushInterval
        );
      });
  }

  disconnect() {
    clearInterval(this._clockSyncInterval);
    clearInterval(this._dataFlushInterval);
  }

  addData(type, data) {
    if (!this._payload[type]) {
      this._payload[type] = [ data ];
    } else {
      this._payload[type].push(data);
    }
  }

  updateJob(id, diff) {
    const data = {action: 'set', params: {}};
    Object.assign(data.params, diff, {id});

    const uri = this._options.endpoint + '/jobs';
    const body = JSON.stringify(data);
    const params = {
      body,
      method: 'POST',
      headers: this._headers,
    };

    return this._fetch(uri, params)
      .then(res => res.json());
  }

  // send collected data to the server
  // this method called every 10 seconds
  _flushData() {
    let data;
    [ data, this._payload ] = [ this._payload, {} ];
    data.host = this._options.hostname;

    const uri = this._options.endpoint;
    const body = JSON.stringify(data);
    const params = {
      body,
      method: 'POST',
      headers: this._headers,
    };

    return this._fetch(uri, params);
  }

  // ping the server to check whether appId and appSecret
  // are valid and correct. Data sent inside http headers.
  _checkAuth() {
    const uri = this._options.endpoint + '/ping';
    const params = {headers: this._headers};
    return this._fetch(uri, params);
  }

  // communicates with the server with http (using fetch)
  // Also handles response http status codes and  retries
  _fetch(uri, params) {
    return retry(() => {
      return fetch(uri, params).then(res => {
        if (res.status === 200) {
          return res;
        }

        if (res.status >= 400 && res.status < 500) {
          throw ERR_ENDRETRY;
        }

        throw new Error('request failed: ' + res.status);
      });
    });
  }
}
