const { getGlobalDispatcher, request, stream, fetch, Client, Pool } = require('undici');
const Transform = require('node:stream').Transform;

class HttpService {
    constructor(name, logger, options = {}) {
        this.name = name;
        this.logger = logger;
        this.log = logger.getLogger('HttpService ' + this.name);

        this.baseUrl ??= options?.baseUrl;
        this.customIdHeader ??= options.customIdHeader;

        this.clientOptions ??= options?.clientOptions;
        this.poolOptions ??= options?.poolOptions;
        this.requestOptions ??= options?.requestOptions || {};

        this.throwOnError ??= options?.throwOnError;
        this.disableDebugLog ??= options?.disableDebugLog;
        this.disableInfoLog ??= options?.disableInfoLog;

        this.dispatcher = null;
        if(!options?.baseUrl && (options?.clientOptions || options?.poolOptions))
            throw new Error('No baseUrl option');
        if(options?.clientOptions)
            this.dispatcher = new Client(this.baseUrl, options?.clientOptions);
        if(options?.poolOptions)
            this.dispatcher = new Pool(this.baseUrl, options?.poolOptions);
        if(!options?.clientOptions && !options?.poolOptions) {
            this.globalDispatcher = getGlobalDispatcher();
        }
    }

    /**
     * Perform an HTTP request over Undici
     * @param {string} path - Path to call or url if no baseUrl provided
     * @param {Object} options - Undici request base options
     * @param {string} mode - Body output mode
     * @param {string|Object} reqId - Request ID for logging or loggin plus custom header
     * @param {string} jsonParseRequest - If mode jsonStream, pass à JSONStream option
     * @returns {Promise<Object>} - Return the result of http call
     */
    async undici(path, options = {}, mode = 'json', reqId = null, jsonParseRequest) {
        this._validateMode(mode);
        path = this._constructPath(path);
        options = this._constructOptions(options, reqId);

        if(!this.disableInfoLog)
            this.log.info(`request ${options.method} ${path} ` + (reqId || ''));

        if(mode === 'fullResponse')
            return this.dispatcher ? this.dispatcher.request({ path, ...options })
                : request(path, { ...options });

        // json, text
        const {
            statusCode, headers, body,
            trailers, opaque, context
        } = await this._makeRequest(path, options);
        const responseBody = await this._parseResponseBody(body, mode, jsonParseRequest);

        return this._constructResult(statusCode, headers, responseBody, trailers, opaque, context);
    }

    /**
     * Direct stream for url (undici stream)
     * @param {string} path Path or url
     * @param {*} options Stream options
     * @param {*} streamFactoryFunction Undici streamFactoryFunction
     * @returns {Promise<Object>} - Undici response with opaque
     */
    stream(path, options = {}, streamFactoryFunction) {
        path = this._constructPath(path);
        if(this.dispatcher) {
            return this.dispatcher.stream({ path, ...options }, streamFactoryFunction);
        }
        return stream(path, { ...options }, streamFactoryFunction);
    }

    /**
     * Fetch implementation for fetch api
     * @param {string} path - Path or url
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} - Undici fetch response.
     */
    fetch(path, options = {}) {
        path = this._constructPath(path);
        if(this.dispatcher) {
            return this.dispatcher.fetch({ path, ...options });
        }
        return fetch(path, { ...options });
    }

    /**
     * Validate output mode.
     * @param {String} mode Mode to validate.
     * @throws Error if invalid mode.
     */
    _validateMode(mode) {
        const validModes = [
            'json',
            'text',
            'jsonStream',
            'textStream',
            'directStream',
            'fullResponse'
        ];

        if (!validModes.includes(mode)) {
            throw new Error('invalid fetch output format' + mode);
        }
    }

    /**
     * Build and return request options
     * @param {Object} options - Undici base request options
     * @param {string} reqId - Request id
     * @returns {Object} - Full request options
     */
    _constructOptions(options, reqId) {
        if(options.timeout && (!this.poolOptions && !this.clientOptions)) {
            options.headersTimeout = options.timeout;
            options.bodyTimeout = options.timeout;
            options.connectTimeout = options.timeout;
            options.connect = options.connect ?? {};
            options.connect.timeout = options.timeout;
            delete options.timeout;
        }

        return {
            ...options,
            ...this.requestOptions,
            headers: this._getHeaders(options, reqId)
        };
    }

    /**
     * Build and return request headers
     * @param {Object} options Request options
     * @param {String} reqId Request ID
     * @returns Request headers
     */
    _getHeaders(options, reqId) {
        let headers = {
            ...options.headers
        };

        if(['POST', 'PUT'].includes(options?.method) && (!options?.headers?.['Content-Type']))
            headers['Content-Type'] = 'application/json';

        if(this.customIdHeader && reqId) {
            headers[this.customIdHeader] = reqId;
        }

        return headers;
    }

    /**
     * Build full path with baseUrl
     * @param {string} path - Relative path or complete URL
     * @returns {string} - Relative path or complete URL
     */
    _constructPath(path) {
        if(this.dispatcher)
            return path;
        return this.baseUrl ? this.baseUrl + path : path;
    }

    /**
     * Perform an Undici request with provided options
     * @param {string} path - Complete path or URL to call
     * @param {Object} options - Request options
     * @returns {Promise<Object>} - Result of Undici request
     * @throws {Error} - Throw if error
     */
    _makeRequest(path, options) {
        return this.dispatcher ? this.dispatcher.request({ path, ...options })
            : request(path, { ...options });
    }

    /**
     * Parse body response to specified mode
     * @param {Object} body Body to parse
     * @param {String} mode Output mode
     * @param {String} jsonParseRequest If jsonStream, parsing with JSONStream
     * @returns Body response parsing result
     */
    _parseResponseBody(body, mode, jsonParseRequest) {
        if(mode && !this[`_handle${mode.charAt(0).toUpperCase() + mode.slice(1)}`]) {
            throw new Error('Undici mode not found');
        }
        return (this[`_handle${mode.charAt(0).toUpperCase() + mode.slice(1)}`])(body, jsonParseRequest);
    }

    /**
     * Retreive response body and text parse
     * @param {Object} body Body to transform
     * @returns Body to text
     */
    _handleText(body) {
        return body.text();
    }

    /**
     * Retreive response body and JSON parse
     * @param {Object} body Body to transform
     * @returns Body to JSON.
     */
    async _handleJson(body) {
        const responseBody = await body.text();
        try {
            return responseBody ? JSON.parse(responseBody) : null;
        } catch (err) {
            this.log.error('Invalid JSON response format : ' + responseBody, err);
            throw new Error('Invalid JSON response format');
        }
    }

    /**
     * Retreive response body and text stream
     * @param {Object} body Body to transform
     * @returns Body to text stream
     */
    async _handleTextStream(body) {
        let transform = new Transform({
            objectMode: true,
            transform: (data, _, done) => {
                done(null, data.toString('utf-8'));
            }
        });
        return body.pipe(transform);
    }

    /**
     * Retreive response body and JSON stream
     * @param {Object} body Body to transform
     * @param {String} jsonParseRequest JSONStream parse request.
     * @returns Body to JSON stream
     */
    async _handleJsonStream(body, jsonParseRequest) {
        if (!jsonParseRequest) {
            throw new Error('Aucun jsonParseRequest fourni');
        }

        const JSONStream = require('JSONStream');
        const es = require('event-stream');

        return body
            .pipe(JSONStream.parse(jsonParseRequest))
            .pipe(es.mapSync((data) => data));
    }

    /**
     * Build final result to return
     * @param {Object} response - Undici response
     * @param {Object} responseBody - Response output formated
     * @returns {Object} - Final result
     * @throws {Error} - If 'throwOnError' property active and response ko
     */
    _constructResult(statusCode, headers, responseBody, trailers, opaque, context) {
        const result = {
            ok: statusCode.toString().slice(0,1) === '2',
            statusCode,
            headers,
            body: responseBody,
            trailers,
            opaque,
            context
        };

        if (!this.disableDebugLog) {
            this.log.debug('Body returned', responseBody);
        }

        if (this.throwOnError && !result.ok) throw result;

        return result || new Error('Undici failed with no response.');
    }

    /**
     * GET method shortcut
     * @name get
     * @param {String} path Path or URL to call
     * @param {Object} options Undici base options
     * @param {String} mode Output mode for response body
     * 'json', 'text', 'jsonStream', 'textStream', 'directStream', 'fullResponse' or null. JSON default.
     * @param {String} reqId Request ID (for logging or custom header)
     * @param {String} jsonParseRequest If jsonStream, perform a JSONStream body output
     * @returns {Promise<Object>} HTTP call result
     */
    get(path, options, mode, reqId, jsonParseRequest) {
        options ??= {};
        options.method ??= 'GET';

        return this.undici(path, options, mode, reqId, jsonParseRequest);
    }

    /**
     * POST method shortcut
     * @name post
     * @param {String} path Path or URL to call
     * @param {Object} body Body to transmit
     * @param {Object} options Undici base options
     * @param {String} mode Output mode for response body
     * 'json', 'text', 'jsonStream', 'textStream', 'directStream', 'fullResponse' or null. JSON default.
     * @param {String} reqId Request ID (for logging or custom header)
     * @param {String} jsonParseRequest If jsonStream, perform a JSONStream body output
     * @returns {Promise<Object>} HTTP call result
     */
    post(path, body, options, mode = 'json', reqId, jsonParseRequest) {
        if (body === null) {
            throw new Error('Body is missing');
        }

        options ??= {};
        options.method ??= 'POST';
        let isCt = options?.headers?.['Content-Type'] &&
            options?.headers?.['Content-Type'] !== 'application/json';
        options.body ??= isCt ? body : JSON.stringify(body);

        return this.undici(path, options, mode, reqId, jsonParseRequest);
    }

    /**
     * PUT method shortcut
     * @name put
     * @param {String} path Path or URL to call
     * @param {Object} body Body to transmit
     * @param {Object} options Undici base options
     * @param {String} mode Output mode for response body
     * 'json', 'text', 'jsonStream', 'textStream', 'directStream', 'fullResponse' or null. JSON default.
     * @param {String} reqId Request ID (for logging or custom header)
     * @param {String} jsonParseRequest If jsonStream, perform a JSONStream body output
     * @returns {Promise<Object>} HTTP call result
     */
    async put(path, body, options, mode = 'json', reqId, jsonParseRequest) {
        options ??= {};
        options.method ??= 'PUT';
        let isCt = options?.headers?.['Content-Type'] &&
            options?.headers?.['Content-Type'] !== 'application/json';
        options.body ??= isCt ? body : JSON.stringify(body);

        return this.undici(path, options, mode, reqId, jsonParseRequest);
    }

    /**
     * DELETE method shortcut
     * @name delete
     * @param {String} path Path or URL to call
     * @param {Object} options Undici base options
     * @param {String} mode Output mode for response body
     * 'json', 'text', 'jsonStream', 'textStream', 'directStream', 'fullResponse' or null. JSON default.
     * @param {String} reqId Request ID (for logging or custom header)
     * @param {String} jsonParseRequest If jsonStream, perform a JSONStream body output
     * @returns {Promise<Object>} HTTP call result
     */
    async del(path, options, mode, reqId, jsonParseRequest) {
        options ??= {};
        options.method ??= 'DELETE';

        return this.undici(path, options, mode, reqId, jsonParseRequest);
    }
}

module.exports = HttpService;
