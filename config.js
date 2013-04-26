var
    config = {};

config.endpoint = {
    url: "http://localhost",
    port: "3000",
    ssl: true
};

config.ssl = {
    key: "./ssl/privatekey.pem",
    certificate: "./ssl/certificate.pem"
};

config.tokens = {
    expireTime: 48 * 60 * 60 * 1000
};

config.resource = {
    original: {
        host: "localhost",
        port: 4000,
        realm: "resourceServer",
        loginPath: "/api/login",
        regex: {
            resourceOwner: /api\/(.*)\/.*/,
            scope: /api\/.*(\/.*)/
        }
    },
    proxy: {
        port: 8000,
        ssl: true
    }
};

exports.config = config;
exports.setConfig = function (newConfig) {
    newConfig.resource.original.regex.resourceOwner = eval(newConfig.resource.original.regex.resourceOwner);
    newConfig.resource.original.regex.scope = eval(newConfig.resource.original.regex.scope);

    config.endpoint = newConfig.endpoint;
    config.ssl = newConfig.ssl;
    config.tokens = newConfig.tokens;
    config.resource = newConfig.resource;
}