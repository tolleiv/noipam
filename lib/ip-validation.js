var ipCalculator = require('ip-subnet-calculator');

function between(x, min, max) {
    return x >= min && x <= max;
}

var check_ip_v4 = exports.check_ip_v4 = function (ip) {
    var chkIPv4 = new RegExp('^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$');
    return ip.match(chkIPv4) != null;
};

exports.validate_net = function (req, res, next) {
    //console.log(req.params);
    if (req.params.net && req.params.suffix) {
        var ip = req.params.net;
        var subnet = parseInt(req.params.suffix)
        if (!check_ip_v4(ip) || !between(subnet, 0, 32)) {
            var err = new Error('Invalid CIDR string argument');
            err.status = 400;
            next(err);
        } else {
            req.params.ip = ip;
            req.params.subnet = subnet;
            req.params.net = ipCalculator.calculateSubnetMask(ip, subnet);
            next();
        }
    } else {
        next()
    }
};