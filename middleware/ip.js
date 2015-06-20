var ipCalculator = require('ip-subnet-calculator');

function between(x, min, max) {
    return x >= min && x <= max;
}

function checkIpV4(ip) {
    var chkIPv4 = new RegExp('^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$');
    return ip.match(chkIPv4);
}

exports.validate_ip = function (req, res, next) {
    if (req.body.ip && !checkIpV4(req.body.ip)) {
        var err = new Error('Invalid IPv4 address argument');
        err.status = 400;
        next(err);
    } else {
        next()
    }
}

exports.validate_net = function (req, res, next) {
    if (req.body.net) {
        var ip = req.body.net.split('/')[0]
        var subnet = parseInt(req.body.net.split('/')[1])
        if(!checkIpV4(ip) || ! between(subnet,0,32)) {
            var err = new Error('Invalid CIDR string argument');
            err.status = 400;
            next(err);
        } else {
            req.body.ip = ip;
            req.body.subnet = subnet;
            req.body.net = ipCalculator.calculateSubnetMask(ip, subnet);
            next();
        }
    } else {
        next()
    }
}