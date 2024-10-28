const assert = require('assert');
const { Client, Pool } = require('undici');
// eslint-disable-next-line n/no-unpublished-require
const architect = require('architect');
const config = require('./_config/tu');
const architectConfig = Object.keys(config).map((name) => (config[name].packagePath = name, config[name]));
const HttpService = require('../src/index.js').HttpService;
let Logger = require('./FakeLogger');
const { Stream } = require('stream');
let logger = new Logger();
let appArch = null;

let streamToArrayFunct = (stream) => {
    let Writable = require('stream').Writable;
    return new Promise((resolve) => {
        let dataArray = [];
        let writable = new Writable({
            objectMode: true,
            write: (data, _, done) => {
                dataArray.push(data);
                done();
            }
        });
        stream.pipe(writable).on('finish',() => {
            return resolve(dataArray);
        });
    });
};

let streamToTextFunct = (stream) => {
    let Writable = require('stream').Writable;
    return new Promise((resolve) => {
        let str = '';
        let writable = new Writable({
            objectMode: true,
            write: (data, _, done) => {
                str += data;
                done();
            }
        });
        stream.pipe(writable).on('finish',() => {
            return resolve(str);
        });
    });
};

/* global describe, before, after, it */
describe('http-helper tu', async () => {
    before((done) => {
        architect.createApp(architect.resolveConfig(architectConfig, __dirname), async (err, app) => {
            if (err) throw err;
            appArch = app;
            done();
        });
    });
    after((done) => {
        if (appArch) {
            appArch.destroy();
            done();
        }
    });
    describe('fullResponse request and dispatcher instanciation', async () => {
        it('retreive a full response with request', (async () => {
            let httpService = new HttpService('tu', logger, { baseUrl: 'http://localhost:8006' });
            const response = await httpService.undici('/api/tu-get-full-response', {
                method: 'GET'
            }, 'fullResponse');
            assert.deepStrictEqual('headers' in response, true);
            assert.deepStrictEqual('body' in response, true);
        }));
        it('retreive a full response with client', (async () => {
            let httpService = new HttpService('tu', logger, { baseUrl: 'http://localhost:8006', clientOptions: {
                headersTimeout: 3e3, connectTimeout: 3e3, bodyTimeout: 3e3, connect: { timeout: 3e3 }
            } });
            assert.ok(httpService.dispatcher instanceof Client);
            const response = await httpService.undici('/api/tu-get-full-response', {
                method: 'GET'
            }, 'fullResponse');
            assert.deepStrictEqual('headers' in response, true);
            assert.deepStrictEqual('body' in response, true);
        }));
        it('retreive a full response with pool', (async () => {
            let httpService = new HttpService('tu', logger, { baseUrl: 'http://localhost:8006', poolOptions: {
                connections: 2, headersTimeout: 3e3, connectTimeout: 3e3, bodyTimeout: 3e3, connect: { timeout: 3e3 }
            } });
            assert.ok(httpService.dispatcher instanceof Pool);
            const response = await httpService.undici('/api/tu-get-full-response', {
                method: 'GET'
            }, 'fullResponse');
            assert.deepStrictEqual('headers' in response, true);
            assert.deepStrictEqual('body' in response, true);
        }));
    });
    describe('json undici timeout', async () => {
        it('Throw error on timeout', (async () => {
            let httpService = new HttpService('tu', logger);
            try {
                await httpService.undici('http://localhost:8006/api/tu-basic-fetch-timeout', {
                    method: 'GET', headersTimeout: 1e3, connectTimeout: 1e3,
                    bodyTimeout: 1e3, connect: { timeout: 1e3 }
                }, 'json');
                assert.ok(1 !== 1);
            } catch (err) {
                assert.deepStrictEqual(err.message, 'Headers Timeout Error');
            }
        }));
    });
    describe('json undici timeout alias', async () => {
        it('Throw error on timeout', (async () => {
            let httpService = new HttpService('tu', logger);
            try {
                await httpService.undici('http://localhost:8006/api/tu-basic-fetch-timeout', {
                    method: 'GET', timeout: 1e3
                }, 'json');
                assert.ok(1 !== 1);
            } catch (err) {
                assert.deepStrictEqual(err.message, 'Headers Timeout Error');
            }
        }));
    });
    describe('basic undici fetch', async () => {
        it('retreive text', (async () => {
            let httpService = new HttpService('tu', logger);
            let res = await httpService.fetch('http://localhost:8006/api/tu-basic-fetch', {
                method: 'GET', timeout: 3e3
            });
            let bText = await res.text();
            assert.deepStrictEqual(res.status, 200);
            assert.deepStrictEqual(bText, '"Ceci est du texte"');
        }));
    });
    describe('basic json fetch', async () => {
        it('retreive json', (async () => {
            let httpService = new HttpService('tu', logger);
            let res = await httpService.fetch('http://localhost:8006/api/tu-basic-fetch-json', {
                method: 'GET', timeout: 3e3
            });
            let bText = await res.json();
            assert.deepStrictEqual(res.status, 200);
            assert.deepStrictEqual(bText, {
                p1: 'ceci est du json'
            });
        }));
    });
    describe('basic json request with baseUrl', async () => {
        it('retreive json', (async () => {
            let httpService = new HttpService('tu', logger, { baseUrl: 'http://localhost:8006/api/' });
            let response = await httpService.undici('tu-basic-fetch-json', {
                method: 'GET', timeout: 1000
            }, 'json');
            assert.deepStrictEqual(response.statusCode, 200);
            assert.deepStrictEqual(response.body, {
                p1: 'ceci est du json'
            });
        }));
    });
    describe('basic json request with throwOnError', async () => {
        it('retreive json', (async () => {
            let httpService = new HttpService('tu', logger, {
                baseUrl: 'http://localhost:8006/api/',
                throwOnError: true });
            try {
                await httpService.undici('tu-basic-fetch-throw', {
                    method: 'GET', timeout: 1000
                });
                throw new Error("Can't go here");
            } catch (err) {
                assert.deepStrictEqual(err.ok, false);
                assert.deepStrictEqual(err.statusCode, 400);
                assert.deepStrictEqual(err.body, { 1002: 'Something went wrong' });
            }
        }));
    });
    describe('json request no body', async () => {
        it('Does not crash if no body is sended', (async () => {
            let httpService = new HttpService('tu', logger);
            let response = await httpService.undici('http://localhost:8006/api/tu-basic-fetch-no-body', {
                method: 'GET', timeout: 1000
            });
            assert.deepStrictEqual(response.statusCode, 200);
            assert.deepStrictEqual(response.body, null);
        }));
    });
    describe('request req id', async () => {
        it('Should transmit Req Id in the headers', (async () => {
            let httpService = new HttpService('tu', logger, { customIdHeader: 'x-req-id' });
            let response = await httpService.undici('http://localhost:8006/api/tu-fetch-req-id', {
                method: 'GET', timeout: 1000
            }, 'json', '1d2sg1f-sfg4df5g4-fdg445');
            assert.deepStrictEqual(response.statusCode, 200);
            assert.deepStrictEqual(response.body, {
                reqIdHeader: '1d2sg1f-sfg4df5g4-fdg445'
            });
        }));
    });
    describe('request text stream', async () => {
        it('retreive a json stream', (async () => {
            let httpService = new HttpService('tu', logger);
            let response = await httpService.undici('http://localhost:8006/api/tu-fetch-stream', {
                method: 'GET', timeout: 1000
            }, 'textStream', null);
            assert.deepStrictEqual(response.statusCode, 200);
            assert.ok(response.body instanceof Stream);
            let readed = await streamToTextFunct(response.body);
            assert.deepStrictEqual(readed, JSON.stringify(require('./routes/rfc.json')));
        }));
    });
    describe('request json stream', async () => {
        it('retreive a json stream', (async () => {
            let httpService = new HttpService('tu', logger);
            let response = await httpService.undici('http://localhost:8006/api/tu-fetch-stream', {
                method: 'GET', timeout: 1000
            }, 'jsonStream', null, '*');
            assert.deepStrictEqual(response.statusCode, 200);
            assert.ok(response.body instanceof Stream);
            let readed = await streamToArrayFunct(response.body);
            assert.deepStrictEqual(readed, require('./routes/rfc.json'));
        }));
    });
    describe('json get shortcut', async () => {
        it('http get shortcut', (async () => {
            let httpService = new HttpService('tu', logger);
            let response = await httpService.get('http://localhost:8006/api/tu-fetch-get', {
                method: 'GET', timeout: 1000
            });
            assert.deepStrictEqual(response.statusCode, 200);
            assert.deepStrictEqual(response.body, { result: 'OK' });
        }));
    });
    describe('json get shortcut with baseUrl', async () => {
        it('http get shortcut', (async () => {
            let httpService = new HttpService('tu', logger, { baseUrl: 'http://localhost:8006' });
            let response = await httpService.get('/api/tu-fetch-get', {
                method: 'GET', timeout: 1000
            });
            assert.deepStrictEqual(response.statusCode, 200);
            assert.deepStrictEqual(response.body, { result: 'OK' });
        }));
    });
    describe('json post shortcut', async () => {
        it('http post shortcut', (async () => {
            let httpService = new HttpService('tu', logger);
            let body = { sended: '123456' };
            let response = await httpService.post('http://localhost:8006/api/tu-fetch-post', body);
            assert.deepStrictEqual(response.statusCode, 200);
            assert.deepStrictEqual(response.body, { result: body.sended });
        }));
    });
    describe('json put shortcut', async () => {
        it('http put shortcut', (async () => {
            let httpService = new HttpService('tu', logger);
            let body = { sended: '123456' };
            let response = await httpService.put('http://localhost:8006/api/tu-fetch-put', body);
            assert.deepStrictEqual(response.statusCode, 200);
            assert.deepStrictEqual(response.body, { result: body.sended });
        }));
    });
    describe('json del shortcut', async () => {
        it('http put shortcut', (async () => {
            let httpService = new HttpService('tu', logger);
            let response = await httpService.del('http://localhost:8006/api/tu-fetch-del');
            assert.deepStrictEqual(response.statusCode, 200);
            assert.deepStrictEqual(response.body, null);
        }));
    });
});
