'use strict';

module.exports = function (sequelize, DataTypes) {
    var AddressConnections = sequelize.define('AddressConnections', {
        AddressId: DataTypes.STRING,
        ConnectedId: DataTypes.INTEGER,
        comment: DataTypes.TEXT
    }, {
        classMethods: {
            associate: function (models) {
                // associations can be defined here
            }
        }
    });

    return AddressConnections;
};