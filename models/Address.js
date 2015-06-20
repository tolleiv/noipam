'use strict';
var IpSubnetCalculator = require('ip-subnet-calculator');

module.exports = function (sequelize, DataTypes) {
    var Address = sequelize.define('Address', {
        value: DataTypes.STRING,
        comment: DataTypes.STRING,
        value_int: DataTypes.INTEGER
    }, {
        classMethods: {
            associate: function (models) {
                // associations can be defined here
            }
        }
    });
    Address.beforeCreate(function (address, options, fn) {
        address.value_int = IpSubnetCalculator.toDecimal(address.value);
        fn(null, address)
    });
    return Address;
};