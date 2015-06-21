var app = require('../app');
var request = require('supertest');

describe('the testframework', function () {
    it('works', function (done) {
        expect(true).toBe(true);
        done()
    });

    it('can call the root page', function (done) {
        request(app).get('/').expect(200, done);
    });
});
