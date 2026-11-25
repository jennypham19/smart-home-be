'use strict'
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class DeliveryOrder extends Model {
        static associate(models) {
            DeliveryOrder.belongsTo(models.Order, {
                foreignKey: 'order_id',
                as: 'DeliveryOrderInfo'
            });
            DeliveryOrder.belongsTo(models.DeliveryPerson, {
                foreignKey: 'delivery_person_id',
                as: 'DeliveryPerson'
            });
            DeliveryOrder.belongsTo(models.Recipient, {
                foreignKey: 'recipient_id',
                as: 'Recipient'
            });
            DeliveryOrder.belongsTo(models.User, {
                foreignKey: 'created_by',
                as: 'DeliveryCreatedByUser'
            });
            DeliveryOrder.belongsTo(models.User, {
                foreignKey: 'approved_by',
                as: 'DeliveryApprovedByUser'
            });
            DeliveryOrder.belongsTo(models.User, {
                foreignKey: 'assigned_to',
                as: 'DeliveryAssignedToUser'
            });
        }
    }

    DeliveryOrder.init({
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        delivery_order_code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        order_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        delivery_person_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        recipient_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        delivery_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        actual_delivery_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        /*
            1. Chờ duyệt: pending_approval
            2. Chờ lấy hàng: awaiting_pickup
            3. Đã lấy hàng: picked_up
            4. Đang giao: out_for_delivery
            5. Đã giao: delivered
            6. Giao thất bại: delivery_failed
            7. Đã huỷ: cancelled
        */
        delivery_status: {
            type: DataTypes.ENUM('pending_approval', 'awaiting_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'delivery_failed', 'cancelled'),
            defaultValue: 'pending_approval'
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        shipping_fee: {
            type: DataTypes.DECIMAL(15, 0),
            allowNull: false
        },
        shipping_carrier: {
            type: DataTypes.STRING,
            allowNull: true
        },
        failure_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false
        },
        approved_by: {
            type: DataTypes.UUID,
            allowNull: true
        },
        assigned_to: {
            type: DataTypes.UUID,
            allowNull: true
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'DeliveryOrder',
        // Timestamps + soft delete (deleted_at)
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
    });
    return DeliveryOrder;
}
