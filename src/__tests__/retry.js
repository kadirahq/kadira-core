import assert from 'assert';
import {describe, it} from 'mocha';
import Counter from './_counter.js';
import retry from '../retry.js';
import {ERR_MAXRETRY, ERR_ENDRETRY} from '../retry.js';

describe('retry', function () {
  it('should retry N times', async function () {
    this.timeout(6e4);
    let erred = false;
    let result;

    // counter will not reach zero
    const counter = new Counter(5);

    try {
      result = await retry(() => counter.decrease());
    } catch (e) {
      assert.equal(e, ERR_MAXRETRY);
      erred = true;
    }

    assert(erred);
    assert.equal(result, undefined);
    assert.equal(counter.count, 1);
  });

  it('should stop on success', async function () {
    this.timeout(6e4);
    let erred = false;
    let result;

    // counter will reach 0 and stop
    const counter = new Counter(2);

    try {
      result = await retry(() => counter.decrease());
    } catch (e) {
      assert.equal(e, ERR_MAXRETRY);
      erred = true;
    }

    assert(!erred);
    assert.equal(result, 'result');
    assert.equal(counter.count, 0);
  });

  it('should stop on endretry', async function () {
    this.timeout(6e4);
    let erred = false;
    let result;

    // counter will reach 10 and stop
    const counter = new Counter(12);

    try {
      result = await retry(() => counter.decrease());
    } catch (e) {
      assert.equal(e, ERR_ENDRETRY);
      erred = true;
    }

    assert(erred);
    assert.equal(result, undefined);
    assert.equal(counter.count, 10);
  });
});
