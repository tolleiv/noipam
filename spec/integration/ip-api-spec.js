var app = require('../../app');
var Bluebird = require('bluebird');
var request = require('supertest');
var reject = require('../helper').reject_body;

describe('the ip API', function () {
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

    it('can confirm ip usage', function (done) {
        this.models.Address.create({value: '10.1.0.1'}).then(function () {
            request(app)
                .get('/ip/10.1.0.1').set('Accept', 'text/plain')
                .expect('Content-Type', /text\/plain/)
                .expect(/^used$/)
                .expect(200, done);
        });
    });

    it('can confirm ip availability', function (done) {
        request(app)
            .get('/ip/10.1.0.1').set('Accept', 'text/plain')
            .expect(/^free/)
            .expect(404, done);
    });

    it('can block additional ips', function (done) {
        request(app)
            .put('/ip/10.1.1.3').set('Accept', 'text/plain')
            .expect(/^success$/)
            .expect(200, done);
    });

    it("can't block already blocked ips", function (done) {
        this.models.Address.create({value: '10.1.1.4'}).then(function () {
            request(app)
                .put('/ip/10.1.1.4').set('Accept', 'text/plain')
                .expect(/^used/)
                .expect(200, done);
        });
    });

    it('can drop blocked ips', function (done) {
        this.models.Address.create({value: '10.1.1.5'}).then(function () {
            request(app)
                .delete('/ip/10.1.1.5').set('Accept', 'text/plain')
                .expect(/^success$/)
                .expect(200, done);
        });
    });

    it('can\'t drop non existing ips', function (done) {
        request(app)
            .delete('/ip/10.1.1.6').set('Accept', 'text/plain')
            .expect(/^not found$/)
            .expect(404, done);
    });

    it('will complain if ip argument is malformed', function (done) {
        request(app)
            .get('/ip/10..1.6').set('Accept', 'text/plain')
            .expect(/invalid IPv4 argument/i)
            .expect(400, done);
    });
});