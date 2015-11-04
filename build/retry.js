'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = retry;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

// default options
var options = {
  maxRetries: 4,
  timeFunction: function timeFunction(i) {
    return 100 * Math.pow(i, 2);
  }
};

// reject the promise with this error when run out of retry attmpts.
var ERR_MAXRETRY = new Error('reached maximum retry limit');

exports.ERR_MAXRETRY = ERR_MAXRETRY;
// reject the promise with this error (in promiser) to stop retrying.
var ERR_ENDRETRY = new Error('use this error to stop retry');

exports.ERR_ENDRETRY = ERR_ENDRETRY;
// retry([options], fn)
// retry module takes a `promiser` function as the main argument.
// The promiser function should return a promise which will be used
// to decide whether the task ran successfully. If the task failed
// it will retry by running the `promiser` function again. Retry will
// stop when it has tried `maxRetries` times or if the promise fails
// with the special error `ERR_ENDRETRY`.

function retry(promiser) {
  // The retry module returns a promise which will end when the task
  // is successful or when the retry fails by retry count or by user.
  // It will also collect start/end times for each retry attempt.
  return new _bluebird2['default'](function (resolve, reject) {
    var count = 0;

    var onError = function onError(err) {
      if (err === ERR_ENDRETRY) {
        reject(ERR_ENDRETRY);
      } else {
        attempt();
      }
    };

    var attempt = function attempt() {
      var millis;
      return regeneratorRuntime.async(function attempt$(context$3$0) {
        while (1) switch (context$3$0.prev = context$3$0.next) {
          case 0:
            if (!(++count > options.maxRetries)) {
              context$3$0.next = 3;
              break;
            }

            reject(ERR_MAXRETRY);
            return context$3$0.abrupt('return');

          case 3:
            millis = options.timeFunction(count);
            context$3$0.next = 6;
            return regeneratorRuntime.awrap(_bluebird2['default'].delay(millis));

          case 6:

            promiser().then(resolve)['catch'](onError);

          case 7:
          case 'end':
            return context$3$0.stop();
        }
      }, null, this);
    };

    // start!
    attempt();
  });
}

// stop a few milliseconds between retries