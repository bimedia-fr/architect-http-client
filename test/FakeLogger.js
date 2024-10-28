class FakeLogger {
    constructor() {
        this.info = ((msg, obj) => {
            // eslint-disable-next-line no-console
            console.log('[FakeLogger info] ' + msg + (obj ? (' ' + JSON.stringify(obj)) : ''));
        });
        this.debug = ((msg, obj) => {
            // eslint-disable-next-line no-console
            console.log('[FakeLogger debug] ' + msg + (obj ? (' ' + JSON.stringify(obj)) : ''));
        });
        this.warn = (() => {});
        this.trace = (() => {});
        this.error = ((msg, obj) => {
            // eslint-disable-next-line no-console
            console.log('[FakeLogger error] ' + msg + (obj ? (' ' + JSON.stringify(obj)) : ''));
        });
    }

    getLogger() {
        return this;
    }

    requestLogger() {
        return this;
    }
}

module.exports = FakeLogger;
