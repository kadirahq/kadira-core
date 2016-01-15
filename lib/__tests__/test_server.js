import {Server} from 'hapi';
import Boom from 'boom';
import Promise from 'bluebird';

export const server = new Server({debug: {log: false, request: false}});
Promise.promisifyAll(server, {context: server});
server.connection({host: 'localhost', port: 8000});

let requestCount = 0;
export const counter = {
  value: () => { return requestCount; },
  reset: () => { requestCount = 0; },
};

// hande requests and reply according to the request type
server.route({method: 'POST', path: '/', handler: (req, reply) => {
  requestCount++;

  switch (req.payload.type) {
    case 'echo':
      reply(req.payload);
      break;
    case 'e400':
      reply(Boom.badRequest());
      break;
    case 'e500':
      reply(Boom.badImplementation());
      break;
    default:
      throw new Error('unknown request');
  }
}});
