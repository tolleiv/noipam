var app = require('../../app');
var Bluebird = require('bluebird');
var request = require('supertest');
var reject = require('../helper').reject_body

describe('the IP blocking API', function () {
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

    it('can call the root page', function (done) {
        request(app).get('/').expect(200, done);
    });

    it('can confirm ip usage', function (done) {
        this.models.Address.create({value: '10.1.0.1'}).then(function () {
            request(app)
                .get('/ip').set('Accept', 'text/plain').send({ip: '10.1.0.1'})
                .expect('Content-Type', /text\/plain/)
                .expect(/^used$/)
                .expect(200, done);
        });
    });

    it('can confirm ip availability', function (done) {
        request(app)
            .get('/ip').set('Accept', 'text/plain').send({ip: '10.1.0.1'})
            .expect(/^free/)
            .expect(404, done);
    });

    it('can list all blocked ips', function (done) {
        this.models.Address.bulkCreate([{value: '10.1.1.1'}, {value: '10.1.1.2'}]).then(function () {
            request(app)
                .get('/ip/used').set('Accept', 'text/plain')
                .expect(/10.1.1.1/)
                .expect(/10.1.1.2/)
                .expect('Content-Length', '20')
                .expect(200, done);
        });
    });

    it('can list all blocked ips for a subnet', function (done) {
        this.models.Address.bulkCreate([{value: '10.1.1.7'}, {value: '10.2.1.7'}, {value: '10.1.80.200'}]).then(function () {
            request(app)
                .get('/ip/used').send({net: '10.1.0.0/16'}).set('Accept', 'text/plain')
                .expect(/10.1.1.7/)
                .expect(/10.1.80.200/)
                .expect(reject(/10.2.1.7/))
                .expect(200, done);
        });
    });

    it('can list all remaining ips for a subnet', function (done) {
        this.models.Address.bulkCreate([{value: '10.3.1.1'}, {value: '10.3.1.2'}, {value: '10.3.1.4'},]).then(function () {
            request(app)
                .get('/ip/remaining').send({net: '10.3.1.0/29'}).set('Accept', 'text/plain')
                .expect(/10.3.1.3/)
                .expect(/10.3.1.5/)
                .expect(reject(/10.3.1.0/))
                .expect(reject(/10.3.1.1/))
                .expect(reject(/10.3.1.9/))
                .expect(200, done);
        });
    });

    it('can block additional ips', function (done) {
        request(app)
            .put('/ip').set('Accept', 'text/plain').send({ip: '10.1.1.3'})
            .expect(/^success$/)
            .expect(200, done);
    });

    it("can't block already blocked ips", function (done) {
        this.models.Address.create({value: '10.1.1.4'}).then(function () {
            request(app)
                .put('/ip').set('Accept', 'text/plain').send({ip: '10.1.1.4'})
                .expect(/^used/)
                .expect(200, done);
        });
    });

    it('can drop blocked ips', function (done) {
        this.models.Address.create({value: '10.1.1.5'}).then(function () {
            request(app)
                .delete('/ip').set('Accept', 'text/plain').send({ip: '10.1.1.5'})
                .expect(/^success$/)
                .expect(200, done);
        });
    });

    it('can\'t drop non existing ips', function (done) {
        request(app)
            .delete('/ip').set('Accept', 'text/plain').send({ip: '10.1.1.6'})
            .expect(/^not found$/)
            .expect(404, done);
    });

    it('will complain if ip argument is malformed', function (done) {
        request(app)
            .get('/ip').set('Accept', 'text/plain').send({ip: '10..1.6'})
            .expect(/Invalid IPv4 address/)
            .expect(400, done);
    });


});