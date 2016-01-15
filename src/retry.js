import Promise from 'bluebird';

// default options
const options = {
  maxRetries: 4,
  timeFunction: i => 100 * Math.pow(i, 2),
};

// reject the promise with this error when run out of retry attmpts.
export const MaxRetryError = class extends Error {
  constructor(message) {
    super(message);
    this.message = message;
  }
};

// reject the promise with this error (in promiser) to stop retrying.
export const ByPassRetryError = class extends Error {
  constructor(message) {
    super(message);
    this.message = message;
  }
};

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
      if (err instanceof ByPassRetryError) {
        reject(err);
      } else {
        attempt(err);
      }
    };

    const attempt = async function (lastError) {
      if (++count > options.maxRetries) {
        const message = `Reached maximum retry limit for ${lastError.message}`;
        const err = new MaxRetryError(message);
        return reject(err);
      }

      // stop a few milliseconds between retries
      const millis = options.timeFunction(count);
      await Promise.delay(millis);

      promiser()
        .then(resolve, onError);
    };

    // start!
    attempt();
  });
}
