module.exports = function setup(options, imports, register) {
    const load = (path) => {
        const RouterAdd = require(path);
        RouterAdd.options = options;
        RouterAdd.imports = imports;
        new RouterAdd();
    };

    load('./Tu');
    register();
};

module.exports.consumes = ['rest', 'log'];
