'use strict'
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {

        }
    }

    User.init({
        // 1. Cột id: BIGINT tự sinh, là khóa chính
        id: {
            type: DataTypes.UUID, // BIGINT UNSIGNED là dùng trong MySQL, nhưng Sequelize không có kiểu dữ liệu UNSIGNED, nên dùng BIGINT bình thường
            allowNull: false,
            defaultValue: DataTypes.UUIDV4, // dùng thư viện uuid => uuidv7 hoặc Sequelize tự sinh UUID (v7): DataTypes.UUIDV7
            primaryKey: true
        },
        account: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('admin', 'manager', 'application-employee', 'production-employee', 'exchange-employee'),
            allowNull: true,
        },
        // 2. email: Email, Varchar(255), có thể null, duy nhất khi khác NULL
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1 // -1: vô hiệu hóa, 1: đang hoạt động
        },
        received_jod_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        is_deleted: {
            type: DataTypes.INTEGER,
            defaultValue: 1 // -1: đã xóa, 1: chưa xóa - còn tồn tại        
        },
        avatar_url: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'User',
        // Tên bảng trong database, mặc định Sequelize sẽ lấy tên model và chuyển sang dạng số nhiều
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return User;
}