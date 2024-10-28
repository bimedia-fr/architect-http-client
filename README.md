# architect-http-client
Architect module for making http calls

### Installation

```sh
npm install --save architect-http-client
```

### Config Format
```js
module.exports = [{
    packagePath: "architect-http-client",
    // Choose your dispatcher name
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
    }
}];
```
Option list by dispatcher
* `baseUrl`: (string) Base URL with port if necessary,
* `requestOptions`: (Object) Set request option for every calls (See Undici request options),
* `clientOptions`: (Object) Instantiate a client dispatcher with options (See Undici client class),
* `poolOptions`: (Object) Instantiate a pool dispatcher with options (See Undici pool class),
* `throwOnError`: (bool) throw an error if response.ok is false (statusCode out of 2XX),
* `customIdHeader`: (Object) { customIdHeader: 'x-req-id' } set custom request ID header if request ID,
* `disableDebugLog`: (bool) disable service debug logs,
* `disableInfoLog`: (bool) disable service infos logs

### Usage

Configure Architect with `config.js` :

```js
module.exports = [{
    packagePath: "architect-http-client",
    myCustomPool: {
        baseUrl: 'http://xxxx:xxxx',
        disableDebugLog: true,
        disableInfoLog: true,
        poolOptions: {
            connections: 2, headersTimeout: 3e3, connectTimeout: 3e3, bodyTimeout: 3e3, connect: { timeout: 3e3 }
        }
    }
}];
```

Perform http call

```js
var path = require('path');
var architect = require("architect");

var configPath = path.join(__dirname, "config.js");
var config = architect.loadConfig(configPath);

architect.createApp(config, async function (err, app) {
    if (err) {
        throw err;
    }
    console.log("app ready");
    let http = app.getService('httpService').myCustomPool;
    let res = await http.get('/api/json-get');
    console.log(res);
    /* res
        {
            ok: true,
            statusCode: 200,
            headers: {},
            body: { result: 'OK' },
            trailers: {},
            opaque: null,
            context: {}
        }
    */
});
```

See Undici documentation for advanced usages.
- https://undici.nodejs.org/#/
- https://github.com/nodejs/undici
