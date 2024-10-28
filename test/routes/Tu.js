class Tu {
    constructor() {
        this.routes = this.constructor.imports.rest;
        this.log = this.constructor.imports.log;
        this.opts = this.constructor.options;
        this.register();
    }

    static imports = null;
    static options = null;

    register() {
        this.routes.get({
            url: '/api/tu-basic-fetch'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-basic-get');
            let response = 'Ceci est du texte';
            log.info('/api/tu-basic-get response', response);
            res.send(200, response);
        });

        this.routes.get({
            url: '/api/tu-basic-fetch-json'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-basic-fetch-json');
            let response = {
                p1: 'ceci est du json'
            };
            log.info('/api/tu-basic-fetch-json response', response);
            res.send(200, response);
        });

        this.routes.get({
            url: '/api/tu-basic-fetch-no-json'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-basic-fetch-no-json');
            let response = 'Ceci est du texte';
            log.info('/api/tu-basic-fetch-no-json response', response);
            res.header('Content-Type', 'text/plain');
            res.sendRaw(200, response);
        });

        this.routes.get({
            url: '/api/tu-basic-fetch-throw'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-basic-fetch-json');
            let response = {
                1002: 'Something went wrong'
            };
            log.info('/api/tu-basic-fetch-json response', response);
            res.send(400, response);
        });

        this.routes.get({
            url: '/api/tu-basic-fetch-no-body'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-basic-fetch-no-body');
            log.info('/api/tu-basic-fetch-no-body response 200 with no body');
            res.send(200);
        });

        this.routes.get({
            url: '/api/tu-basic-fetch-timeout'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-basic-fetch-timeout');
            await new Promise(resolve => { setTimeout(resolve, 2000); });
            log.info('/api/tu-basic-fetch-timeout response too late');
            res.send(200, { p1: 'OK' });
        });

        this.routes.get({
            url: '/api/tu-fetch-req-id'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-fetch-req-id');
            let reqIdHeader = req.headers['x-req-id'];
            let response = {
                reqIdHeader: reqIdHeader
            };
            log.info('/api/tu-fetch-req-id response', response);
            res.send(200, response);
        });

        this.routes.get({
            url: '/api/tu-fetch-stream'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-fetch-stream');
            let response = require('./rfc.json');
            log.info('/api/tu-fetch-stream response', response[0].identifiant_magasin);
            res.send(200, response);
        });

        this.routes.get({
            url: '/api/tu-fetch-get'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-fetch-get');
            let response = { result: 'OK' };
            log.info('/api/tu-fetch-get response', response);
            res.send(200, response);
        });

        this.routes.get({
            url: '/api/tu-get-full-response'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-get-full-response');
            let response = require('./fullResponse.json');
            log.info('/api/tu-fetch-get fullResponse', response);
            res.send(200, response);
        });

        this.routes.post({
            url: '/api/tu-fetch-post'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-fetch-post');
            let response = { result: req.body.sended };
            log.info('/api/tu-fetch-post response', response);
            res.send(200, response);
        });

        this.routes.put({
            url: '/api/tu-fetch-put'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-fetch-put');
            let response = { result: req.body.sended };
            log.debug('/api/tu-fetch-put response', response);
            res.send(200, response);
        });

        this.routes.del({
            url: '/api/tu-fetch-del'
        }, async (req, res) => {
            let logger = this.log.requestLogger(req);
            let log = logger.getLogger('tu-fetch-del');
            log.info('/api/tu-fetch-del response');
            res.send(200);
        });
    }
}

module.exports = Tu;
