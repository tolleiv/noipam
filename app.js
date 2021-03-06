var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var log4js = require('log4js');
var logger = log4js.getLogger();
var timeplan = require('timeplan');
var cookieParser = require('cookie-parser');
var swig = require('swig');
var bodyParser = require('body-parser');

var routes_idx = require('./routes/index');
var routes_ip = require('./routes/ip');
var routes_net = require('./routes/net');
var routes_connection = require('./routes/connection');

var app = express();

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(log4js.connectLogger(logger, { level: 'auto' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(function (req, res, next) {
    if (req.query.pretty && ['html'].indexOf(req.query.pretty) > -1) {
        app.engine('html', swig.renderFile);
        app.set('view engine', 'html');
        app.set('views', path.join(__dirname, 'views/interactive'));
    } else if (req.query.pretty && ['simple'].indexOf(req.query.pretty) > -1) {
        app.engine('html', swig.renderFile);
        app.set('view engine', 'html');
        app.set('views', path.join(__dirname, 'views/simple'));
    } else {
        app.engine('txt', swig.renderFile);
        app.set('view engine', 'txt');
        res.set('Content-Type', 'text/plain');
        app.set('views', path.join(__dirname, 'views/text'));
    }
    next();
});

app.use('/', routes_idx);
app.use('/ip', routes_ip);
app.use('/net', routes_net);
app.use('/connection', routes_connection);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

if (app.get('env') !== 'test') {
    timeplan.delayed({
        period: 's',
        task: function () {
            timeplan.repeat({
                period: '1s',
                task: require('./lib/timeplan').updateReverseDns
            })
        }
    });
}

module.exports = app;
