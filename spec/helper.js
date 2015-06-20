exports.reject_body = function (regex) {
    return function (res) {
        if (res.text.match(regex)) {
            throw new Error('expected ' + value + ' not to match "' + regex);
        }
    }
}
