const assert = require('assert');
const { Client, Pool } = require('undici');
// eslint-disable-next-line n/no-unpublished-require
const architect = require('architect');
let config = require('./_config/tu');
// Add architect-http-client config
config['../src/index'] = {
    request: {
        baseUrl: 'http://localhost:8006',
        disableDebugLog: true, disableInfoLog: true
    },
    client: {
        baseUrl: 'http://localhost:8006',
        disableDebugLog: true, disableInfoLog: true,
        clientOptions: {
            headersTimeout: 3e3, connectTimeout: 3e3, bodyTimeout: 3e3, connect: { timeout: 3e3 }
        }
    },
    pool: {
        baseUrl: 'http://localhost:8006',
        disableDebugLog: true, disableInfoLog: true,
        poolOptions: {
            connections: 2, headersTimeout: 3e3, connectTimeout: 3e3, bodyTimeout: 3e3, connect: { timeout: 3e3 }
        }
    },
    noServer: {
        baseUrl: 'http://localhost:8007',
        disableDebugLog: true, disableInfoLog: true,
        poolOptions: {
            connections: 2, headersTimeout: 3e3, connectTimeout: 3e3, bodyTimeout: 3e3, connect: { timeout: 3e3 }
        }
    }
};
const architectConfig = Object.keys(config).map((name) => (config[name].packagePath = name, config[name]));
let appArch = null;

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
    describe('architect config instanciation', async () => {
        it('should instanciate simple request, client or pool httpService', (async () => {
            let httpService = appArch.getService('httpService');
            assert.ok(httpService.request.dispatcher == null);
            assert.ok(httpService.client.dispatcher instanceof Client);
            assert.ok(httpService.pool.dispatcher instanceof Pool);
        }));
        describe('basic json fetch with request', async () => {
            it('retreive json', (async () => {
                let httpService = appArch.getService('httpService').request;
                let response = await httpService.undici('/api/tu-basic-fetch-json', {
                    method: 'GET', timeout: 1000
                }, 'json');
                assert.deepStrictEqual(response.statusCode, 200);
                assert.deepStrictEqual(response.body, {
                    p1: 'ceci est du json'
                });
            }));
        });
        describe('basic json fetch with client', async () => {
            it('retreive json', (async () => {
                let httpService = appArch.getService('httpService').client;
                let response = await httpService.undici('/api/tu-basic-fetch-json', {
                    method: 'GET', timeout: 1000
                }, 'json');
                assert.deepStrictEqual(response.statusCode, 200);
                assert.deepStrictEqual(response.body, {
                    p1: 'ceci est du json'
                });
            }));
        });
        describe('basic json fetch with pool', async () => {
            it('retreive json', (async () => {
                let httpService = appArch.getService('httpService').pool;
                let response = await httpService.undici('/api/tu-basic-fetch-json', {
                    method: 'GET', timeout: 1000
                }, 'json');
                assert.deepStrictEqual(response.statusCode, 200);
                assert.deepStrictEqual(response.body, {
                    p1: 'ceci est du json'
                });
            }));
        });
        describe('basic json fetch with noServer', async () => {
            it('retreive json', (async () => {
                let httpService = appArch.getService('httpService').noServer;
                try {
                    await httpService.undici('/api/tu-basic-fetch-json', {
                        method: 'GET', timeout: 1000
                    }, 'json');
                    assert.ok(false);
                } catch (err) {
                    assert.deepStrictEqual(err.message, 'connect ECONNREFUSED 127.0.0.1:8007');
                }
            }));
        });
    });
});
