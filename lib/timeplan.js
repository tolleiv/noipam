var models = require('../models');
var dns = require('dns');

exports.updateReverseDns = function () {
    models.Address.findOne({
        order: [['dnsUpdatedAt', 'ASC']]
    }).then(function (address) {
        if (!address) {
            return
        }
        dns.reverse(address.value, function (err, hostnames) {
            address.dnsUpdatedAt = models.Sequelize.NOW;
            if (!err && hostnames.length > 0) {
                address.dns = hostnames.join(', ');
            } else {
                address.dns = null;
            }
            address.save()
        });
    });
};