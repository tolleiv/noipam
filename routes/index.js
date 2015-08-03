var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    var port = process.env.PORT || '3000';
    var uri = process.env.BASE_URI ? process.env.BASE_URI : 'localhost:' + port;
    res.render('index', { base_uri: uri });
});

module.exports = router;
