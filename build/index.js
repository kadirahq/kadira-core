'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _clockJs = require('./clock.js');

var _clockJs2 = _interopRequireDefault(_clockJs);

var _retryJs = require('./retry.js');

var _retryJs2 = _interopRequireDefault(_retryJs);

var DEFAULTS = {
  appId: '',
  appSecret: '',
  endpoint: 'https://enginex.kadira.io',
  hostname: 'localhost',
  clockSyncInterval: 1000 * 60,
  dataFlushInterval: 1000 * 10
};

var Kadira = (function () {
  function Kadira(_options) {
    _classCallCheck(this, Kadira);

    this._options = Object.assign({}, DEFAULTS, _options);
    this._payload = { host: this._options.hostname };
    this._headers = {
      'kadira-app-id': this._options.appId,
      'kadira-app-secret': this._options.appSecret
    };

    this._clock = new _clockJs2['default']({
      endpoint: this._options.endpoint + '/simplentp/sync'
    });

    this._clockSyncInterval = null;
    this._dataFlushInterval = null;
  }

  _createClass(Kadira, [{
    key: 'connect',
    value: function connect() {
      var _this2 = this;

      return this._checkAuth().then(function callee$2$0() {
        return regeneratorRuntime.async(function callee$2$0$(context$3$0) {
          var _this = this;

          while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
              context$3$0.next = 2;
              return regeneratorRuntime.awrap(this._clock.sync());

            case 2:

              this._clockSyncInterval = setInterval(function () {
                return _this._clock.sync();
              }, this._options.clockSyncInterval);

              this._dataFlushInterval = setInterval(function () {
                return _this._flushData();
              }, this._options.dataFlushInterval);

            case 4:
            case 'end':
              return context$3$0.stop();
          }
        }, null, _this2);
      });
    }
  }, {
    key: 'disconnect',
    value: function disconnect() {
      clearInterval(this._clockSyncInterval);
      clearInterval(this._dataFlushInterval);
    }
  }, {
    key: 'addData',
    value: function addData(type, data) {
      if (!this._payload[type]) {
        this._payload[type] = [data];
      } else {
        this._payload[type].push(data);
      }
    }
  }, {
    key: 'updateJob',
    value: function updateJob(id, diff) {
      var data = { action: 'set', params: {} };
      Object.assign(data.params, diff, { id: id });

      var uri = this._options.endpoint + '/jobs';
      var body = JSON.stringify(data);
      var params = {
        body: body,
        method: 'POST',
        headers: this._headers
      };

      return this._fetch(uri, params).then(function (res) {
        return res.json();
      });
    }

    // send collected data to the server
    // this method called every 10 seconds
  }, {
    key: '_flushData',
    value: function _flushData() {
      var data = undefined;
      var _ref = [this._payload, {}];
      data = _ref[0];
      this._payload = _ref[1];

      data.host = this._options.hostname;

      var uri = this._options.endpoint;
      var body = JSON.stringify(data);
      var params = {
        body: body,
        method: 'POST',
        headers: this._headers
      };

      return this._fetch(uri, params);
    }

    // ping the server to check whether appId and appSecret
    // are valid and correct. Data sent inside http headers.
  }, {
    key: '_checkAuth',
    value: function _checkAuth() {
      var uri = this._options.endpoint + '/ping';
      var params = { headers: this._headers };
      return this._fetch(uri, params);
    }

    // communicates with the server with http (using fetch)
    // Also handles response http status codes and  retries
  }, {
    key: '_fetch',
    value: function _fetch(uri, params) {
      return (0, _retryJs2['default'])(function () {
        return (0, _isomorphicFetch2['default'])(uri, params).then(function (res) {
          if (res.status === 200) {
            return res;
          }

          if (res.status >= 400 && res.status < 500) {
            throw _retryJs.ERR_ENDRETRY;
          }

          throw new Error('request failed: ' + res.status);
        });
      });
    }
  }]);

  return Kadira;
})();

exports['default'] = Kadira;
module.exports = exports['default'];