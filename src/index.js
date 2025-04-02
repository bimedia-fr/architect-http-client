const HttpService = require('./HttpService');
var httpServices = {};

module.exports = async function (options, imports, register) {
    try {
        for(let key in options) {
            if(Object.hasOwnProperty.call(options, key) && !['packagePath', 'provides', 'consumes', 'setup'].includes(key)) {
                let conf = options[key];
                httpServices[key] = new HttpService(key, imports.log, conf);
            }
        }
        register(null, {
            onDestroy: function () {
                return (async () => {
                    let isGlobalDispatchClosed = false;
                    for(let key in httpServices) {
                        if((typeof httpServices[key] === 'object') && httpServices[key].dispatcher) {
                            await httpServices[key].dispatcher.close();
                        }
                        else if((typeof httpServices[key] === 'object') && httpServices[key].globalDispatcher && !isGlobalDispatchClosed) {
                            await httpServices[key].globalDispatcher.close();
                            isGlobalDispatchClosed = true;
                        }
                    }
                })()
                    .then(() => {});
            },
            httpService: httpServices
        });
    } catch (err) {
        register(err);
    }
};

module.exports.provides = ['httpService'];
module.exports.consumes = ['log'];
module.exports.HttpService = HttpService;
