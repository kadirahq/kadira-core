import {Server} from 'hapi';
import Boom from 'boom';

const hapi = new Server({debug: {log: false, request: false}});
hapi.connection({host: 'localhost', port: 8000});

let requestCount = 0;
let latestData = {};
let latestJobs = {};

export default {
  start: callback => hapi.start(callback),
  stop: callback => hapi.stop(callback),
  getCount: () => requestCount,
  setCount: n => requestCount = n,
  getData: () => latestData,
  setData: d => latestData = d,
  getJobs: () => latestJobs,
  setJobs: d => latestJobs = d,
};

function authenticate(req) {
  return (
    req.headers['kadira-app-id'] === 'test-app-id' &&
    req.headers['kadira-app-secret'] === 'test-app-secret'
  );
}

// handles metric/trace data requests.
hapi.route({method: '*', path: '/', handler: (req, reply) => {
  requestCount++;
  if (authenticate(req)) {
    latestData = req.payload;
    reply('');
  } else {
    reply(Boom.unauthorized());
  }
}});

// handles job updates.
hapi.route({method: '*', path: '/jobs', handler: (req, reply) => {
  requestCount++;
  if (authenticate(req)) {
    latestJobs = req.payload;
    reply({});
  } else {
    reply(Boom.unauthorized());
  }
}});

// handle ntp requests and return the timestamp in milliseconds (simple text)
// in order to test client-server difference, return the time with 1s lag
hapi.route({method: '*', path: '/simplentp/sync', handler: (req, reply) => {
  requestCount++;
  reply(Date.now() - 1000);
}});

// handle ping requests (only used to verify appId/appSecret values)
hapi.route({method: '*', path: '/ping', handler: (req, reply) => {
  requestCount++;
  if (authenticate(req)) {
    reply('');
  } else {
    reply(Boom.unauthorized());
  }
}});

// test route to test text responses.
hapi.route({method: '*', path: '/_test/text', handler: (req, reply) => {
  requestCount++;
  reply('hello-world');
}});

// test route to test json responses.
hapi.route({method: '*', path: '/_test/json', handler: (req, reply) => {
  requestCount++;
  reply({foo: 'bar'});
}});

// test route to test e4xx responses.
hapi.route({method: '*', path: '/_test/e4xx', handler: (req, reply) => {
  requestCount++;
  reply(Boom.badRequest());
}});

// test route to test e5xx responses.
hapi.route({method: '*', path: '/_test/e5xx', handler: (req, reply) => {
  requestCount++;
  reply(Boom.badImplementation());
}});
