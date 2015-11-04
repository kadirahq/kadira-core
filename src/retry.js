import Promise from 'bluebird';

// default options
const options = {
  maxRetries: 4,
  timeFunction: i => 100 * Math.pow(i, 2),
};

// reject the promise with this error when run out of retry attmpts.
export const ERR_MAXRETRY = new Error('reached maximum retry limit');

// reject the promise with this error (in promiser) to stop retrying.
export const ERR_ENDRETRY = new Error('use this error to stop retry');

// retry([options], fn)
// retry module takes a `promiser` function as the main argument.
// The promiser function should return a promise which will be used
// to decide whether the task ran successfully. If the task failed
// it will retry by running the `promiser` function again. Retry will
// stop when it has tried `maxRetries` times or if the promise fails
// with the special error `ERR_ENDRETRY`.
export default function retry(promiser) {
  // The retry module returns a promise which will end when the task
  // is successful or when the retry fails by retry count or by user.
  // It will also collect start/end times for each retry attempt.
  return new Promise(function (resolve, reject) {
    let count = 0;

    const onError = function (err) {
      if (err === ERR_ENDRETRY) {
        reject(ERR_ENDRETRY);
      } else {
        attempt();
      }
    };

    const attempt = async function () {
      if (++count > options.maxRetries) {
        reject(ERR_MAXRETRY);
        return;
      }

      // stop a few milliseconds between retries
      const millis = options.timeFunction(count);
      await Promise.delay(millis);

      promiser()
        .then(resolve)
        .catch(onError);
    };

    // start!
    attempt();
  });
}
