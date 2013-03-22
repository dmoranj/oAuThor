var
    config = {};

config.endpoint = {
    url: "http://localhost",
    port: "3000"
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
        port: 4000
    },
    proxy: {
        port: 8000
    }
};

module.exports = config;