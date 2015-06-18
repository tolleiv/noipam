var helper = require('./spec-helper');

describe("the test suite API", function () {
    var request = helper.req;

    beforeEach(function () {
        runs(helper.start());
        waitsFor(helper.isStarted);
    });
    afterEach(helper.stop);

    it("can call the api", function (done) {
        request.get("/", done);
    });
});