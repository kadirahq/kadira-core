import assert from 'assert';
import {describe, it, beforeEach, afterEach} from 'mocha';
import server from './_server.js';
import Kadira from '../index.js';
import {ByPassRetryError} from '../retry.js';

describe('kadira', function () {
  const endpoint = 'http://localhost:8000';
  const validAuth = {appId: 'test-app-id', appSecret: 'test-app-secret'};
  const validOpts = Object.assign({endpoint}, validAuth);
  const invldOpts = Object.assign({endpoint});

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

  describe('connect', function () {
    it('should throw with wrong info', async function () {
      let erred = false;
      const kadira = new Kadira(invldOpts);

      try {
        await kadira.connect();
      } catch (e) {
        assert.equal(e instanceof ByPassRetryError, true);
        erred = true;
      }

      assert(erred);
      kadira.disconnect();
    });

    it('should connect with correct info', async function () {
      const kadira = new Kadira(validOpts);
      await kadira.connect();
      kadira.disconnect();
    });

    it('should sync the diff value', async function () {
      const kadira = new Kadira(validOpts);
      await kadira.connect();
      kadira.disconnect();
      assert(inRange(kadira._clock._diff, -1100, -900));
    });
  });

  describe('sendData', function () {
    it('should send data to the server', async function () {
      const options = Object.assign({}, validOpts, {dataFlushInterval: 100});
      const kadira = new Kadira(options);
      await kadira.connect();
      kadira.disconnect();

      await kadira.sendData({
        test1: [ {a: 'b'}, {c: 'd'} ],
        test2: [ {e: 'f'} ],
      });

      assert.deepEqual(server.getData(), {
        host: kadira._options.hostname,
        test1: [ {a: 'b'}, {c: 'd'} ],
        test2: [ {e: 'f'} ],
      });
    });
  });

  describe('updateJob', function () {
    it('should send data to the server', async function () {
      const kadira = new Kadira(validOpts);
      await kadira.connect();
      kadira.disconnect();

      await kadira.updateJob('job-0', {foo: 'bar'});
      assert.deepEqual(server.getJobs(), {
        action: 'set',
        params: {id: 'job-0', foo: 'bar'},
      });
    });
  });

  describe('getJob', function () {
    it('should send data to the server', async function () {
      const kadira = new Kadira(validOpts);
      await kadira.connect();
      kadira.disconnect();

      const res = await kadira.getJob('job-0');
      assert.deepEqual(res, {aa: 10});
      assert.deepEqual(server.getJobs(), {
        action: 'get',
        params: {id: 'job-0'},
      });
    });
  });

  describe('_checkAuth', () => {
    describe('with correct login info', () => {
      it('should just return', done => {
        const kadira = new Kadira(validOpts);
        kadira._checkAuth().then(() => {
          done();
        });
      });
    });

    describe('with bad login info', () => {
      it('should throw an error', done => {
        const kadira = new Kadira(invldOpts);
        kadira._checkAuth().catch(err => {
          assert.equal(err.message, 'Unauthorized');
          done();
        });
      });
    });
  });
});
