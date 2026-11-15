'use strict'
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Product extends Model {
        static associate(models) {

        }
    }

    Product.init({
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
        sku_code: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        brand: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        category: {
            type: DataTypes.ENUM('smart_device', 'accessory'),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('in_stock', 'out_of_stock', 'restocking'),
            allowNull: false,
            defaultValue: 'in_stock'
        }
    }, {
        sequelize,
        modelName: 'Product',
        // Tên bảng trong database, mặc định Sequelize sẽ lấy tên model và chuyển sang dạng số nhiều
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return Product;
}