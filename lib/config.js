var env = process.env.NODE_ENV || 'development';
var config = require(__dirname + '/../config/config.json')[env] || {};


exports.get = function (key, def) {
    cfg = process.env[key] || config[key] || undefined;
    console.log(env + ": " + key + "= " + cfg);
    return cfg || def;
}
