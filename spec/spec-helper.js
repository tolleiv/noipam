var http = require('http');
var request = require("request");
var server, app, started = false;

exports.req = {
    get: function (path, callback) {
        return request({url: "http://127.0.0.1:3001" + path, json:true}, callback);
    },
    post: function (path, data, callback) {
        return request.post({
            url: "http://127.0.0.1:3001" + path,
            json: data
        }, callback);
    },
    put: function (path, data, callback) {
        return request.put({
            url: "http://127.0.0.1:3001" + path,
            json: data
        }, callback);
    },
    del: function (path, callback) {
        return request.del("http://127.0.0.1:3001" + path, callback);
    },

    redirectsTo: function(path, cb) {
        return function(err, res, body) {
            expect(err).toBeNull();
            expect(res.statusCode).toBeGreaterThan(300)
            expect(res.statusCode).toBeLessThan(305)
            expect(res.headers.location).toEqual(path)
            cb && cb(body);
        }
    },

    respondsPositive:  function (cb) {
        return function (err, res, body) {
            expect(err).toBeNull();
            if (res) {
                expect(res.statusCode).toEqual(200);
                if (res.statusCode != 200) console.log(res.body)
            }

            cb && cb(body);

        }
    },
    respondsNegative: function (cb) {
        return function (err, res, body) {
            expect(err).toBe(null)
            expect(res.statusCode).toBeGreaterThan(399)
            expect(res.statusCode).toBeLessThan(500)
            cb && cb(body, res.statusCode);
        }
    }
};

var startServer = function (env) {
    app = require("../app.js");
    app.set('env', env);
    server = http.createServer(app);
    server.listen(3001)
        .on('listening', function () {
            setTimeout(function () {
                started = true;
            }, 100)
        })
        .on('close', function () {
            started = false;
        });
};

exports.start = function () {
    return function () {
            startServer('test')
    }
};

exports.isStarted = function () {
    return started;
};

exports.stop = function (cb) {
        server.close(cb);
};
