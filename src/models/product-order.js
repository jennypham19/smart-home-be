'use strict'
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ProductOrder extends Model {
        static associate(models) {
            ProductOrder.belongsTo(models.Order, {
                foreignKey: 'order_id',
                as: 'ProductsInOrder'
            })
        }
    }

    ProductOrder.init({
        // 1. Cột id: BIGINT tự sinh, là khóa chính
        id: {
            type: DataTypes.UUID, // BIGINT UNSIGNED là dùng trong MySQL, nhưng Sequelize không có kiểu dữ liệu UNSIGNED, nên dùng BIGINT bình thường
            allowNull: false,
            defaultValue: DataTypes.UUIDV4, // dùng thư viện uuid => uuidv7 hoặc Sequelize tự sinh UUID (v7): DataTypes.UUIDV7
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull:false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        order_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        is_checked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'ProductOrder',
        // Tên bảng trong database, mặc định Sequelize sẽ lấy tên model và chuyển sang dạng số nhiều
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return ProductOrder;
}