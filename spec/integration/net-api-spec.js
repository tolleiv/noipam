var app = require('../../app');
var Bluebird = require('bluebird');
var request = require('supertest');
var reject = require('../helper').reject_body;
var async = require('async');

describe('the subnet API', function () {
    beforeEach(function (done) {
        var models = this.models = require('../../models/index');
        models.sequelize.sync().then(function (err) {
            Bluebird.all([
                models.Address.destroy({truncate: true})
            ]);
            done();
        });
    });
    afterEach(function (done) {
        var models = require('../../models/index');
        models.sequelize.dropAllSchemas().then(function (err) {
            done();
        });
    });

    it('can list all blocked ips', function (done) {
        this.models.Address.bulkCreate([{value: '10.1.1.1'}, {value: '10.1.1.2'}]).then(function () {
            request(app)
                .get('/net/used')
                .expect(/10.1.1.1/)
                .expect(/10.1.1.2/)
                .expect('Content-Length', '19')
                .expect(200, done);
        });
    });

    it('can list all blocked ips for a subnet', function (done) {
        this.models.Address.bulkCreate([{value: '10.1.1.7'}, {value: '10.2.1.7'}, {value: '10.1.80.200'}]).then(function () {
            request(app)
                .get('/net/used/10.1.0.0/16')
                .expect(/10.1.1.7/)
                .expect(/10.1.80.200/)
                .expect(reject(/10.2.1.7/))
                .expect(200, done);
        });
    });

    it('can list all remaining ips for a subnet', function (done) {
        this.models.Address.bulkCreate([{value: '10.3.1.1'}, {value: '10.3.1.2'}, {value: '10.3.1.4'}]).then(function () {
            request(app)
                .get('/net/remaining/10.3.1.0/29')
                .expect(/10.3.1.3/)
                .expect(/10.3.1.5/)
                .expect(reject(/10.3.1.0/))
                .expect(reject(/10.3.1.1/))
                .expect(reject(/10.3.1.9/))
                .expect(200, done);
        });
    });

    it('can block a remaining ip from a subnet', function (done) {
        var models = this.models;
        async.series([
                function (cb) {
                    models.Address
                        .bulkCreate([{value: '10.4.1.1'}, {value: '10.4.1.2'}])
                        .then(function (rows) {
                            cb(null, rows);
                        })
                        .error(cb);
                },
                function (cb) {
                    request(app)
                        .post('/net/next/10.4.1.0/29')
                        .expect(/^10.4.1.3$/)
                        .expect(200, cb);
                },
                function (cb) {
                    request(app)
                        .post('/net/next/10.4.1.0/29')
                        .expect(/^10.4.1.4$/)
                        .expect(200, cb);
                }
            ],
            function (err, results) {
                done(err);
            });
    });

    it("can't block if no ip is remaining in the subnet", function(done) {
        var models = this.models;
        async.series([
                function (cb) {
                    models.Address
                        .bulkCreate([{value: '10.5.1.1'}, {value: '10.5.1.2'}])
                        .then(function (rows) {
                            cb(null, rows);
                        })
                        .error(cb);
                },
                function (cb) {
                    request(app)
                        .post('/net/next/10.5.1.0/30')
                        .expect(/^nothing left$/)
                        .expect(500, cb);
                }
            ],
            function (err, results) {
                done(err);
            });
    });

    it('will complain if net argument is malformed', function (done) {
        request(app)
            .get('/net/used/10..1.6/24')
            .expect(/Invalid CIDR string/)
            .expect(400, done);
    });

    it('will complain if suffix argument is malformed', function (done) {
        request(app)
            .get('/net/used/10.1.1.6/39')
            .expect(/Invalid CIDR string/)
            .expect(400, done);
    });

});