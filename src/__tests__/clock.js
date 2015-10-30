import assert from 'assert';
import {describe, it, beforeEach, afterEach} from 'mocha';
import {server, counter} from './test_server.js';
import Clock from '../clock.js';

describe('Clock', () => {
  let clock;

  beforeEach(() => {
    counter.reset();
    clock = new Clock('http://localhost:8000/ntp');
    return server.startAsync();
  });

  afterEach(() => {
    return server.stopAsync();
  });

  describe('sync', () => {
    it('should set diff value', async function () {
      await clock.sync();
      assert(clock._diff < -900 && clock._diff > -1100);
    });

    it('should retry if unreachable', async function() {
      let erred = false;
      this.timeout(6e4);

      // stop the http server
      await server.stopAsync();

      try {
        await clock.sync();
      } catch (e) {
        assert.equal(e.message, 'reached maximum retry limit');
        erred = true;
      }

      assert(erred);
      assert.equal(counter.value(), 0);
    });
  });
});
