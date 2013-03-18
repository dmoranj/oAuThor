var
    config = {};

config.endpoint = {
    url: "http://localhost",
    port: "3000"
};

config.tokens = {
    expireTime: 48 * 60 * 60 * 1000
};

module.exports = config;