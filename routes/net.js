var express = require('express');
var models = require('../models');
var validate_net = require('../lib/ip-validation').validate_net;
var blockedWithinNet = require('../lib/ip-blocking').blockedWithinNet;
var remainingWithinNet = require('../lib/ip-blocking').remainingWithinNet;
var async = require('async');
var router = express.Router();

/**
 * @api {get} net/used/:net/:suffix List IPs blocked for subnet
 * @apiGroup Subnet
 *
 * @apiParam {IPv4} net the subnet to check
 * @apiParam {Suffix} suffix the suffix for the net
 *
 * @apiSuccess {String} ips List of used IPs delimited by newline
 * */
router.get('/used/:net/:suffix', validate_net, function (req, res) {
    blockedWithinNet(req.params.net, null, function (rows) {
        res.render('ip_list', {
            title: 'Blocks IPs within ' + req.params.ip + '/' + req.params.suffix,
            amount: rows.length,
            rows: rows
        });
    });
});

/**
 * @api {get} net/used List all IPs blocked
 * @apiGroup Subnet
 *
 * @apiSuccess {String} ips List of used IPs delimited by newline
 * */
router.get('/used', function (req, res) {
    models.Address.findAll({order: [['valueInt', 'ASC']]}).then(function (rows) {
        res.render('ip_list', {
            title: 'Blocks IPs',
            amount: rows.length,
            rows: rows
        });
    });
});

/**
 * @api {get} net/remaining/:net/:suffix List IPs remaining for subnet
 * @apiGroup Subnet
 *
 * @apiParam {IPv4} net the subnet to check
 * @apiParam {Suffix} suffix the suffix for the net
 *
 * @apiSuccess {String} ips List of available IPs delimited by newline
 * */
router.get('/remaining/:net/:suffix', validate_net, function (req, res) {
    remainingWithinNet(req.params.net, null, function (remaining) {
        res.render('ip_list', {
            title: 'Available IPs within ' + req.params.ip + '/' + req.params.suffix,
            amount: remaining.length,
            rows: remaining
        });
    });
});

/**
 * @api {post} net/next/:net/:suffix block next IP in subnet
 * @apiGroup Subnet
 *
 * @apiParam {IPv4} net the subnet to check
 * @apiParam {Suffix} suffix the suffix for the net
 *
 * @apiSuccess {IPv4} ip The successfully blocked IP
 * @apiError (Error 500) {String} err Error string
 * */
router.post('/next/:net/:suffix', validate_net, function (req, res) {
    models.sequelize.transaction({isolationLevel: 'SERIALIZABLE'}).then(function (t) {
        remainingWithinNet(req.params.net, t, function (remaining) {
            if (remaining.length == 0) {
                t.rollback();
                res.status(500).send('nothing left');
            } else {
                var addr = remaining[0];
                addr.comment = req.body.comment;
                models.Address.create(addr, {transaction: t}).then(function () {
                    t.commit();
                    res.status(302).set('Location', '/ip/' + remaining[0].value).send(remaining[0].value);
                }).error(function () {
                    t.rollback();
                    res.status(500).send('failure');
                });
            }
        });
    });
});

/**
 * @api {get} net/connected/:net/:suffix List IPs connected to IPs from the subnet
 * @apiGroup Subnet
 *
 * @apiParam {IPv4} net the subnet to check
 * @apiParam {Suffix} suffix the suffix for the net
 *
 * @apiSuccess {String} ips List of connected IPs delimited by newline
 * */
router.get('/connected/:net/:suffix', validate_net, function (req, res) {
    blockedWithinNet(req.params.net, null, function (rows) {
        var connectedRows = [];
        async.concat(rows,
            function (row, callback) {
                row.getConnected().then(function (connected) {
                    var conn = [];
                    for (var i = 0; i < connected.length; i++) {
                        conn.push({
                            from: row,
                            to: connected[i]
                        })
                    }

                    callback(null, conn)
                });
            },
            function (err, results) {
                res.render('ip_connection', {
                    title: 'IPs connected to ' + req.params.ip + '/' + req.params.suffix,
                    amount: results.length,
                    rows: results
                });
            });

    });
});

module.exports = router;
