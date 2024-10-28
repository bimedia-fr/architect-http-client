const modules = {};

modules['architect-access-log'] = {
    fmt: ':Xip - :userID ":method :url :protocol/:httpVersion" :statusCode :contentLength ":referer" ":userAgent" - :delta',
    filters: [],
    userID: (req) => {
        return `[${req.id()}]`;
    }
};

modules['architect-log4js'] = {
    request: {
        property: function (req) {
            return req.id();
        }
    },
    config: {
        appenders: {
            out: {
                type: 'stdout'
            }
        },
        categories: {
            default: {
                appenders: ['out'],
                level: 'debug'
            }
        }
    }
};

modules['architect-restify'] = {
    port: 8006
};

modules['./routes/routes.js'] = {};

module.exports = modules;
