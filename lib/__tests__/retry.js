import assert from 'assert';
import {describe, it} from 'mocha';
import retry from '../retry.js';
import {ByPassRetryError, MaxRetryError} from '../retry.js';

describe('retry', function () {
  it('should retry N times', async function () {
    this.timeout(6e4);
    let erred = false;
    let result;
    const err = new Error('Some Error');

    try {
      result = await retry(() => {
        return new Promise((_, r) => r(err));
      });
    } catch (e) {
      assert.equal(e instanceof MaxRetryError, true);
      assert.equal(e.message, `Reached maximum retry limit for ${err.message}`);
      erred = true;
    }

    assert(erred);
    assert.equal(result, undefined);
  });

  it('should stop on success', async function () {
    this.timeout(6e4);
    let erred = false;
    let result;

    try {
      result = await retry(() => Promise.resolve('result'));
    } catch (e) {
      erred = true;
    }

    assert(!erred);
    assert.equal(result, 'result');
  });

  it('should stop on endretry', async function () {
    this.timeout(6e4);
    let erred = false;
    let result;

    try {
      result = await retry(() => {
        return new Promise((_, reject) => reject(new ByPassRetryError('ERR')));
      });
    } catch (e) {
      assert.equal(e instanceof ByPassRetryError, true);
      assert.equal(e.message, 'ERR');
      erred = true;
    }

    assert(erred);
    assert.equal(result, undefined);
  });
});
