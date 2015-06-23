var models = require('../models');
var ipCalculator = require('ip-subnet-calculator');

var blockedWithinNet = exports.blockedWithinNet = function (net, t, cb) {
    var filter = {
        transaction: t,
        where: {
            value_int: {
                $gte: net.ipLow,
                $lte: net.ipHigh
            }
        },
        order: [['value_int', 'ASC']],
        include: [{model: models.Address, as: 'Connected'}]
    };
    models.Address.findAll(filter).then(cb);
};
var remainingWithinNet = exports.remainingWithinNet = function (net, t, cb) {
    blockedWithinNet(net, t, function (rows) {
        rows = rows.map(function (row) {
            return row.value_int;
        });
        var remaining = [];
        for (var i = net.ipLow; i < net.ipHigh; i++) {
            var ip = ipCalculator.toString(i);
            if (rows.indexOf(i) == -1 && !ip.match(/\.(0|255)$/)) {
                remaining.push({value: ip, value_int: i, comment: ''})
            }
        }
        cb(remaining);
    });
};