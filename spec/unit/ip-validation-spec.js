var check_ip_v4 = require('../../lib/ip-validation').check_ip_v4;

describe('the ip validation', function () {

    var valid = ['1.1.1.1', '255.255.255.255', '192.168.1.1', '10.10.1.1', '132.254.111.10', '26.10.2.10', '127.0.0.1'];

    it('can confirm valid ip addresses', function () {
        for (var i = 0; i < valid.length; i++) {
            expect(check_ip_v4(valid[i])).toBe(true);
        }
    });

    var invalid = ['10.10.10', '10.10', '10', 'a.a.a.a', '10.0.0.a', '10.10.10.256', '222.222.2.999', '999.10.10.20', '2222.22.22.22', '22.2222.22.2'];

    it('can reject invalid ip addresses', function () {
        for (var i = 0; i < invalid.length; i++) {
            expect(check_ip_v4(invalid[i])).toBe(false);
        }
    });
});
