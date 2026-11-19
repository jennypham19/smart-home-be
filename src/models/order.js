'use strict'
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Order extends Model {
        static associate(models) {
            Order.belongsTo(models.User, {
                foreignKey: 'created_by',
                as: 'OrderCreatedByUser'
            });
            Order.hasMany(models.ProductOrder, {
                foreignKey: 'order_id',
                as: 'OrderProducts'
            });
            Order.hasOne(models.DeliveryOrder, {
                foreignKey: 'order_id',
                as: 'OrderOfDelivery'
            })
        }
    }

    Order.init({
        // 1. Cột id: BIGINT tự sinh, là khóa chính
        id: {
            type: DataTypes.UUID, // BIGINT UNSIGNED là dùng trong MySQL, nhưng Sequelize không có kiểu dữ liệu UNSIGNED, nên dùng BIGINT bình thường
            allowNull: false,
            defaultValue: DataTypes.UUIDV4, // dùng thư viện uuid => uuidv7 hoặc Sequelize tự sinh UUID (v7): DataTypes.UUIDV7
            primaryKey: true
        },
        code: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        product_quantity: {
            type: DataTypes.INTEGER,
            allowNull:false
        },
        process: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        /*
            1. Chờ sản xuất: pending_production
            2. Đang sản xuất: in_production
            3. Đã sản xuất: production_completed
            4. Chờ duyệt: pending_approval
            5. Đã duyệt: approved
            6. Từ chối: rejected
            7. Chờ quản lý duyệt: pending_manager_approval
            8. Quản lý duyệt: manager_approved
            9. Quản lý từ chối: manager_rejected
        */
        status: {
            type: DataTypes.ENUM('pending_production', 'in_production', 'production_completed', 'pending_approval', 'approved', 'rejected', 'pending_manager_approval', 'manager_approved', 'manager_rejected'),
            defaultValue: 'pending_production'
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false
        },
        is_order_shipping_created: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'Order',
        // Tên bảng trong database, mặc định Sequelize sẽ lấy tên model và chuyển sang dạng số nhiều
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return Order;
}