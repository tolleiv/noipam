var express = require('express');
var models = require('../models');
var blockedWithinNet = require('../lib/ip-blocking').blockedWithinNet;
var remainingWithinNet = require('../lib/ip-blocking').remainingWithinNet;
var router = express.Router();

/**
 * @api {get} ip IP availability
 * @apiGroup IP
 *
 * @apiParam {IPv4} ip the address to check
 * */
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

/**
 * @api {get} ip/used IPs blocked
 * @apiGroup IP
 *
 * @apiParam {CIDR} net the subnet to check (default: all)
 * */
router.get('/used', function (req, res) {
    var result = function (rows) {
        res.render('ip_list', {rows: rows});
    };

    if (req.body.net) {
        blockedWithinNet(req.body.net,null, result)
    } else {
        models.Address.findAll().then(result);
    }
});

/**
 * @api {get} ip/remaining IPs remaining
 * @apiGroup IP
 *
 * @apiParam {CIDR} net the subnet to check
 * */
router.get('/remaining', function (req, res) {
    remainingWithinNet(req.body.net, null, function (remaining) {
        res.render('ip_list', {rows: remaining});
    });
});

/**
 * @api {post} ip/next block next IP in subnet
 * @apiGroup IP
 *
 * @apiParam {CIDR} net the subnet to check
 * */
router.post('/next', function (req, res) {

    return models.sequelize.transaction({isolationLevel: 'SERIALIZABLE'}).then(function (t) {
        remainingWithinNet(req.body.net, t, function (remaining) {
            if (remaining.length == 0) {
                t.rollback();
                res.status(500).send('nothing left');
            } else {
                models.Address.create(remaining[0], {transaction: t}).then(function () {
                    t.commit();
                    res.send(remaining[0].value);
                }).error(function () {
                    t.rollback();
                    res.status(500).send('failure');
                });
            }
        });
    });
});

/**
 * @api {put} ip Block IP
 * @apiGroup IP
 *
 * @apiParam {IPv4} ip the address to block
 * */
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
                res.status(500).send('failure');
            });
        } else {
            res.send('used');
        }
    });
});

/**
 * @api {delete} ip Unblock IP
 * @apiGroup IP
 *
 * @apiParam {IPv4} ip the address to unblock
 * */
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
