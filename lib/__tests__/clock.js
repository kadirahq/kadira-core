import assert from 'assert';
import {describe, it, beforeEach, afterEach} from 'mocha';
import server from './_server.js';
import Clock from '../clock.js';

describe('clock', function () {
  const endpoint = 'http://localhost:8000/simplentp/sync';

  function inRange(n, min, max) {
    return n <= max && n >= min;
  }

  beforeEach(function (done) {
    server.setCount(0);
    return server.start(done);
  });

  afterEach(function (done) {
    return server.stop(done);
  });

  it('should set diff value', async function () {
    const clock = new Clock({endpoint});
    await clock.sync();
    assert(inRange(clock._diff, -1100, -900));
  });

  it('should return fixed current time', async function () {
    const clock = new Clock({endpoint});
    await clock.sync();
    assert(inRange(clock.getTime() - Date.now(), -1100, -900));
  });

  it('should return fixed timestamps', async function () {
    const clock = new Clock({endpoint});
    await clock.sync();
    assert(inRange(clock.fixTime(1e4) - 1e4, -1100, -900));
  });
});
