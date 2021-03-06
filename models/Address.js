'use strict';
var ipCalculator = require('ip-subnet-calculator');

module.exports = function (sequelize, DataTypes) {
    var Address = sequelize.define('Address', {
        value: DataTypes.STRING,
        comment: DataTypes.TEXT,
        dns: DataTypes.TEXT,
        valueInt: DataTypes.INTEGER,
        dnsUpdatedAt: DataTypes.DATE
    }, {
        classMethods: {
            associate: function (models) {
                // associations can be defined here
            }
        }
    });

    Address.belongsToMany(Address, {as: 'Connected', through: 'AddressConnections'});

    Address.beforeCreate(function (address, options, fn) {
        address.valueInt = ipCalculator.toDecimal(address.value);
        fn(null, address)
    });
    Address.beforeBulkCreate(function (addresses, options, fn) {
        addresses = addresses.map(function (address) {
            address.valueInt = ipCalculator.toDecimal(address.value);
            return address;
        });
        fn(null, addresses)
    });
    return Address;
};