'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _retryJs = require('./retry.js');

var _retryJs2 = _interopRequireDefault(_retryJs);

var DEFAULTS = {
  endpoint: ''
};

var Clock = (function () {
  function Clock(_options) {
    _classCallCheck(this, Clock);

    this._options = Object.assign({}, DEFAULTS, _options);
    this._diff = 0;
    this.ready = false;
  }

  _createClass(Clock, [{
    key: 'getTime',
    value: function getTime() {
      // current time on Kadira server
      return this._clientTS() + this._diff;
    }
  }, {
    key: 'fixTime',
    value: function fixTime(timestamp) {
      // `timestamp` on Kadira server
      return timestamp + this._diff;
    }
  }, {
    key: 'sync',
    value: function sync() {
      var _this = this;

      // calculate the time difference
      return (0, _retryJs2['default'])(function () {
        return _this._syncOnce();
      });
    }
  }, {
    key: '_clientTS',
    value: function _clientTS() {
      // Get client timestamp while considering time related
      // libraries messing up the Date object. "Y U DO THIS?"
      var now = Date.now();
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
  }, {
    key: '_syncOnce',
    value: function _syncOnce() {
      var _this2 = this;

      var startTS = undefined;

      return this._fetchTime().then(function () {
        startTS = _this2._clientTS();
        return _this2._fetchTime();
      }).then(function (serverTS) {
        var latency = (_this2._clientTS() - startTS) / 2;
        _this2._diff = serverTS - latency - startTS;
        _this2.ready = true;
      });
    }
  }, {
    key: '_fetchTime',
    value: function _fetchTime() {
      return (0, _isomorphicFetch2['default'])(this._options.endpoint).then(function (res) {
        if (res.status !== 200) {
          throw new Error('request failed: ' + res.status);
        }

        return res.text().then(function (txt) {
          return parseInt(txt, 10);
        });
      });
    }
  }]);

  return Clock;
})();

exports['default'] = Clock;
module.exports = exports['default'];