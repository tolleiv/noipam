var express = require('express');
var models = require('../models');
var validate_net = require('../lib/ip-validation').validate_net;
var blockedWithinNet = require('../lib/ip-blocking').blockedWithinNet;
var remainingWithinNet = require('../lib/ip-blocking').remainingWithinNet;
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
        res.render('ip_list', {rows: rows});
    });
});

/**
 * @api {get} net/used List all IPs blocked
 * @apiGroup Subnet
 *
 * @apiSuccess {String} ips List of used IPs delimited by newline
 * */
router.get('/used', function (req, res) {
    models.Address.findAll({order:[['value_int', 'ASC']]}).then(function (rows) {
        res.render('ip_list', {rows: rows});
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
        res.render('ip_list', {rows: remaining});
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
    return models.sequelize.transaction({isolationLevel: 'SERIALIZABLE'}).then(function (t) {
        remainingWithinNet(req.params.net, t, function (remaining) {
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

module.exports = router;
