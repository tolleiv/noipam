var express = require('express');
var models = require('../models');
var router = express.Router();
var check_ip_v4 = require('../lib/ip-validation').check_ip_v4;

router.route('/:ip')
    .all(function (req, res, next) {
        if (!req.params.ip) {
            res.status(400).send('ip argument missing');
        } else if (!check_ip_v4(req.params.ip)) {
            res.status(400).send('invalid IPv4 argument');
        } else {
            next();
        }
    })

/**
 * @api {get} ip/:ip Read availability if IP
 * @apiGroup IP
 *
 * @apiParam {IPv4} ip the address to check
 * */
    .get(function (req, res) {
        models.Address.find({
            where: {value: req.params.ip}
        }).then(function (address) {
            if (!address) {
                res.status(404).send('free');
            } else {
                res.send('used');
            }
        });
    })

/**
 * @api {put} ip/:ip Create blocked IP
 * @apiGroup IP
 *
 * @apiParam {IPv4} ip the address to block
 * */
    .put(function (req, res) {
        models.Address.find({
            where: {value: req.params.ip}
        }).then(function (address) {
            if (!address) {
                models.Address.create({
                    value: req.params.ip,
                    comment: req.body.comment
                }).then(function () {
                    res.send('success');
                }).error(function () {
                    res.status(500).send('failure');
                });
            } else {
                res.send('used');
            }
        });
    })

/**
 * @api {delete} ip/:ip Delete IP block
 * @apiGroup IP
 *
 * @apiParam {IPv4} ip the address to unblock
 * */
    .delete(function (req, res) {
        models.Address.find({
            where: {value: req.params.ip}
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
