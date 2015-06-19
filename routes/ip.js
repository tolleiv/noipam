var express = require('express');
var models = require('../models');
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

router.get('/used', function (req, res) {
    models.Address.findAll().then(function (rows) {
        var ips = rows.map(function (row) {
            return row.value;
        });
        res.send(ips.join(('\n')))
    });
});

router.put('/', function (req, res) {
    models.Address.create({
        value: req.body.ip
    }).then(function () {
        res.send('success');
    }).error(function () {
        res.send('failure');
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
