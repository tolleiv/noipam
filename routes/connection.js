var express = require('express');
var models = require('../models');
var async = require('async');
var router = express.Router();
var check_ip_v4 = require('../lib/ip-validation').check_ip_v4;

router.get('/:ip', function (req, res) {
    models.Address.find({
        where: {value: req.params.ip}
    }).then(function (address) {
        address.getConnected().then(function (connected) {
            var conn = [];
            for (var i = 0; i < connected.length; i++) {
                conn.push({
                    from: address,
                    to: connected[i]
                })
            }
            res.render('ip_connection', {title: 'Connection to ' + req.params.ip, rows: conn});
        });
    });
});

function fetchSourceTargetAddress(req, res, t, actionCallback) {
    async.waterfall([
            function (cb) {
                if (!check_ip_v4(req.params.ip)) {
                    t.rollback();
                    res.status(400).send('source address invalid');
                } else if (!check_ip_v4(req.params.target)) {
                    t.rollback();
                    res.status(400).send('target address invalid');
                } else {
                    cb(null)
                }
            },
            function (cb) {
                models.Address
                    .find({where: {value: req.params.ip}, transaction: t})
                    .then(cb.bind(null, null))
                    .error(cb)
            },
            function (from, cb) {
                models.Address
                    .find({where: {value: req.params.target}, transaction: t})
                    .then(cb.bind(null, null, from))
                    .error(cb)
            },
            function (from, to, cb) {
                if (!from) {
                    t.rollback();
                    res.status(404).send('source not found');
                } else if (!to) {
                    t.rollback();
                    res.status(404).send('target not found');
                } else {
                    cb(null, from, to);
                }
            },
            actionCallback,
            function (result, cb) {
                t.commit();
                res.send('success');
            }
        ],
        function (err, results) {
            t.rollback();
            res.status(500).send('failure');
        });
}

router.put('/:ip/to/:target', function (req, res) {
    models.sequelize.transaction({isolationLevel: 'SERIALIZABLE'}).then(function (t) {
        fetchSourceTargetAddress(req, res, t, function (from, to, cb) {
            from.addConnected(to, {transaction: t, comment: req.body.comment})
                .then(cb.bind(null, null))
                .error(cb);
        });
    });
});
router.delete('/:ip/to/:target', function (req, res) {
    models.sequelize.transaction({isolationLevel: 'SERIALIZABLE'}).then(function (t) {
        fetchSourceTargetAddress(req, res, t, function (from, to, cb) {
            from.removeConnected(to, {transaction: t})
                .then(cb.bind(null, null))
                .error(cb);
        });
    });
});

module.exports = router;
