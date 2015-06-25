var app = require('../../app');
var Bluebird = require('bluebird');
var request = require('supertest');
var reject = require('../helper').reject_body;
var async = require('async');

describe('the connection API', function () {
    beforeEach(function (done) {
        var models = this.models = require('../../models/index');
        models.sequelize.sync().then(function (err) {
            Bluebird.all([
                models.Address.destroy({truncate: true}),
                models.Address.bulkCreate([{value: '10.9.1.1'}, {value: '10.9.1.2'}, {value: '10.9.1.3'}, {value: '10.9.1.4'}])
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

    it('can list all connections for one address', function (done) {
        var models = this.models;
        async.waterfall([
                function (cb) {
                    models.Address
                        .findAll({order: [['valueInt', 'ASC']]})
                        .then(cb.bind(null, null))
                        .error(cb);
                },
                function (rows, cb) {
                    rows[0].addConnected([rows[1], rows[2]])
                        .then(cb.bind(null, null))
                        .error(cb);
                },
                function (rows, cb) {
                    request(app)
                        .get('/connection/10.9.1.1')
                        .expect(/10.9.1.2/)
                        .expect(/10.9.1.3/)
                        .expect(200, done);
                }
            ],
            function (err, results) {
                done(err);
            });
    });

    it('can create a connection between ips', function (done) {
        var models = this.models;
        async.series([
                function (cb) {
                    request(app)
                        .put('/connection/10.9.1.3/to/10.9.1.1')
                        .expect(/^success$/)
                        .expect(200, cb);
                },
                function (cb) {
                    request(app)
                        .get('/connection/10.9.1.3')
                        .expect(/10.9.1.1/)
                        .expect(200, done);
                }
            ],
            function (err) {
                done(err);
            });
    });

    it("can't connect to non blocked source ips", function (done) {
        request(app)
            .put('/connection/2.2.2.2/to/10.9.1.3')
            .expect(/not found/)
            .expect(404, done);
    });

    it("can't connect to malformed source ips", function (done) {
        request(app)
            .put('/connection/2.2..2/to/10.9.1.3')
            .expect(/address invalid/)
            .expect(400, done);
    });

    it("can't connect to non blocked target ips", function (done) {
        request(app)
            .put('/connection/10.9.1.3/to/2.2.2.2')
            .expect(/not found/)
            .expect(404, done);
    });

    it("can't connect to malformed target ips", function (done) {
        request(app)
            .put('/connection/10.9.1.3/to/2.2.2')
            .expect(/address invalid/)
            .expect(400, done);
    });

    it('can remove a connection between ips', function (done) {
        var models = this.models;
        async.waterfall([
                function (cb) {
                    models.Address
                        .findAll({order: [['valueInt', 'ASC']]})
                        .then(cb.bind(null, null))
                        .error(cb);
                },
                function (rows, cb) {
                    rows[1].addConnected(rows[0])
                        .then(cb.bind(null, null))
                        .error(cb);
                },
                function (rows, cb) {
                    request(app)
                        .get('/connection/10.9.1.2')
                        .expect(/10.9.1.1/)
                        .expect(200, cb.bind(null));
                },
                function (req, cb) {
                    request(app)
                        .delete('/connection/10.9.1.2/to/10.9.1.1')
                        .expect(/^success$/)
                        .expect(200, cb.bind(null));
                },
                function (res, cb) {
                    request(app)
                        .get('/connection/10.9.1.2')
                        .expect(reject(/10.9.1.1/))
                        .expect(200, cb.bind(null));
                }
            ],
            function (err, results) {
                done(err);
            });
    });

});