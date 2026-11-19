'use strict'
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class DeliveryPerson extends Model {
        static associate(models) {
            DeliveryPerson.hasMany(models.DeliveryOrder, {
                foreignKey: 'delivery_person_id',
                as: 'PersonOfDeliveryOrder'
            })
        }
    }

    DeliveryPerson.init({
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
        vehicle_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        license_plate: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active'
        }
    }, {
        sequelize,
        modelName: 'DeliveryPerson',
        // Timestamps + soft delete (deleted_at)
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
    });
    return DeliveryPerson;
}
