import {describe, it, before} from 'mocha';
import {Server} from 'hapi';
import {Courier} from '../courier.js';

describe('Courier', () => {
  let server;
  const headers = {};
  const endpoint = 'http://localhost:8000';
  const courier = new Courier({endpoint, headers});

  // TODO move the server to another test module
  // and add methods to make it return errors

  before(done => {
    server = new Server();
    server.connection({host: 'localhost', port: 8000});
    server.start(done);
    server.route({
      method: 'POST',
      path: '/',
      handler: (request, reply) => {
        reply({foo: 'bar'});
      },
    });
  });

  describe('post', () => {
    it('should post given data', async () => {
      const [ res, body ] = await courier.post('test');
      console.log('res, body', res, body);
    });

    it('should retry if unreachable');
    it('should retry if 5xx error');
    it('should not retry if 4xx error');
  });
});
