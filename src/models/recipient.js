'use strict'
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Recipient extends Model {
        static associate(models) {
            Recipient.hasMany(models.DeliveryOrder, {
                foreignKey: 'recipient_id',
                as: 'RecipientOfDeliveryOrder'
            })
        }
    }

    Recipient.init({
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Recipient',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return Recipient;
}
