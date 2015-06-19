var app      = require('../../app');
var Bluebird = require('bluebird');
var request  = require('supertest');

describe("the test suite API", function () {
    beforeEach(function (done) {
        var models = this.models = require('../../models/index');
        models.sequelize.sync().then(function(err) {
            Bluebird.all([
                models.Address.destroy({ truncate: true })
            ]);
            done();
        });
    });
    afterEach(function(done) {
        var models = require('../../models/index');
        models.sequelize.dropAllSchemas().then(function(err) {
            done();
        });
    });

    it("can call the api", function (done) {
        request(app).get('/').expect(200, done);
    });
});