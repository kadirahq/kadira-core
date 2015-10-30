import assert from 'assert';
import {describe, it, beforeEach, afterEach} from 'mocha';
import {server, counter} from './test_server.js';
import Courier from '../courier.js';

describe('Courier', () => {
  const endpoint = 'http://localhost:8000';
  const courier = new Courier(endpoint);

  beforeEach(() => {
    counter.reset();
    return server.startAsync();
  });

  afterEach(() => {
    return server.stopAsync();
  });

  describe('post', () => {
    it('should post given data', async function() {
      const req = {type: 'echo'};
      const res = await courier.send(req);
      assert.equal(counter.value(), 1);
      assert.deepEqual(res, req);
    });

    it('should retry if unreachable', async function() {
      let erred = false;
      this.timeout(6e4);

      // stop the http server
      await server.stopAsync();

      try {
        const req = {foo: 'bar'};
        await courier.send(req);
      } catch (e) {
        assert.equal(e.message, 'reached maximum retry limit');
        erred = true;
      }

      assert(erred);
      assert.equal(counter.value(), 0);
    });

    it('should retry if 5xx error', async function() {
      let erred = false;
      this.timeout(6e4);

      try {
        const req = {type: 'e500'};
        await courier.send(req);
      } catch (e) {
        assert.equal(e.message, 'reached maximum retry limit');
        erred = true;
      }

      assert(erred);
      assert.equal(counter.value(), 5);
    });

    it('should not retry if 4xx error', async function() {
      let erred = false;

      try {
        const req = {type: 'e400'};
        await courier.send(req);
      } catch (e) {
        assert.equal(e.message, 'failed by client error: 400');
        erred = true;
      }

      assert(erred);
      assert.equal(counter.value(), 1);
    });
  });
});
