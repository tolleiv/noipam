'use strict';
module.exports = function (sequelize, DataTypes) {
    var Address = sequelize.define('Address', {
        value: DataTypes.STRING,
        comment: DataTypes.STRING
    }, {
        classMethods: {
            associate: function (models) {
                // associations can be defined here
            }
        }
    });
    return Address;
};