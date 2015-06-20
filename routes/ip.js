var express = require('express');
var models = require('../models');
var ipCalculator = require('ip-subnet-calculator');
var router = express.Router();

router.get('/', function (req, res) {
    models.Address.find({
        where: {value: req.body.ip}
    }).then(function (address) {
        if (!address) {
            res.status(404).send('free');
        } else {
            res.send('used');
        }
    });
});

function blockedWithinNet(net, cb) {
    var filter = {
        where: {
            value_int: {
                $gte: net.ipLow,
                $lte: net.ipHigh
            }
        }
    }
    models.Address.findAll(filter).then(cb);
}

router.get('/used', function (req, res) {

    var result = function (rows) {
        res.render('ip_list', {rows: rows});
    };

    if (req.body.net) {
        blockedWithinNet(req.body.net, result)
    } else {
        models.Address.findAll().then(result);
    }
});

router.get('/remaining', function (req, res) {
    blockedWithinNet(req.body.net, function (rows) {
        rows = rows.map(function (row) {
            return row.value_int;
        });
        var remaining = [];
        for (var i = req.body.net.ipLow; i <= req.body.net.ipHigh; i++) {
            var ip = ipCalculator.toString(i);
            if (rows.indexOf(i) == -1 && !ip.match(/\.(0|255)$/)) {
                remaining.push({value: ip, value_int: i, comment: ''})
            }
        }
        res.render('ip_list', {rows: remaining});
    });
});

router.put('/', function (req, res) {
    models.Address.find({
        where: {value: req.body.ip}
    }).then(function (address) {
        if (!address) {
            models.Address.create({
                value: req.body.ip
            }).then(function () {
                res.send('success');
            }).error(function () {
                res.send('failure');
            });
        } else {
            res.send('used');
        }
    });

});
router.delete('/', function (req, res) {
    models.Address.find({
        where: {value: req.body.ip}
    }).then(function (address) {
        if (!address) {
            res.status(404).send('not found');
        } else {
            address.destroy().then(function () {
                res.send('success');
            });
        }
    });
});

module.exports = router;
