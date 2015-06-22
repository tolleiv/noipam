var express = require('express');
var models = require('../models');
var async = require('async');
var router = express.Router();
var check_ip_v4 = require('../lib/ip-validation').check_ip_v4;

router.get('/:ip', function (req, res) {
    models.Address.find({
        where: {value: req.params.ip}
    }).then(function (address) {
        address.getConnected().then(function (rows) {
            res.render('ip_list', {title: 'Connection to ' + req.params.ip, rows: rows});
        });
    });
});

function fetchSourceTargetAddress(req, res, actionCallback) {
    async.waterfall([
            function (cb) {
                if (!check_ip_v4(req.params.ip)) {
                    res.status(400).send('source address invalid');
                } else if (!check_ip_v4(req.params.target)) {
                    res.status(400).send('target address invalid');
                } else {
                    cb(null)
                }
            },
            function (cb) {
                models.Address
                    .find({where: {value: req.params.ip}})
                    .then(cb.bind(null, null))
                    .error(cb)
            },
            function (from, cb) {
                models.Address
                    .find({where: {value: req.params.target}})
                    .then(cb.bind(null, null, from))
                    .error(cb)
            },
            function (from, to, cb) {
                if (!from) {
                    res.status(404).send('source not found');
                } else if (!to) {
                    res.status(404).send('target not found');
                } else {
                    cb(null, from, to);
                }
            },
            actionCallback,
            function (result, cb) {
                res.send('success');
            }
        ],
        function (err, results) {
            res.status(500).send('failure');
        });
}

router.put('/:ip/to/:target', function (req, res) {
    fetchSourceTargetAddress(req, res, function (from, to, cb) {
        from.addConnected(to)
            .then(cb.bind(null, null))
            .error(cb)
    });
});
router.delete('/:ip/to/:target', function (req, res) {
    fetchSourceTargetAddress(req, res, function (from, to, cb) {
        from.removeConnected(to)
            .then(cb.bind(null, null))
            .error(cb)
    });
});

module.exports = router;
