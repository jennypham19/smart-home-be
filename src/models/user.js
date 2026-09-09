'use strict'
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {

        }
    }

    User.init({
        // Cột id: BIGINT tự sinh, là khóa chính
        id: {
            type: DataTypes.BIGINT, // BIGINT UNSIGNED là dùng trong MySQL, nhưng Sequelize không có kiểu dữ liệu UNSIGNED, nên dùng BIGINT bình thường
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        // full_name: Họ tên đầy đủ, Varchar(150), không được null
        full_name: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        // phone: Số điện thoại - định danh đăng nhập chính, Varchar(20), không được null, duy nhất
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        // email: Email, Varchar(255), có thể null, duy nhất khi khác NULL
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        // password: Mật khẩu, Varchar(255), null nếu chỉ đăng nhập OTP, không null nếu đăng nhập bằng mật khẩu, bcrypt cost >= 12
        password: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        // avatar_url: Đường dẫn ảnh đại diện, varchar(500), có thể null
        avatar_url: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        // gender: Giới tính, ENUM('male', 'female', 'other'), có thể null
        gender: {
            type: DataTypes.ENUM('male', 'female', 'other'),
            allowNull: true
        },
        // date_of_birth: Ngày sinh (phục vụ ưu đãi sinh nhật), DATE, có thể null
        date_of_birth: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // role: Vai trò trong hệ thống, ENUM (‘customer’, ‘affiliate’, ‘staff’, ‘admin’), không được null, mặc định là ‘customer’, index
        role: {
            type: DataTypes.ENUM('customer', 'affiliate', 'staff', 'admin'),
            allowNull: false,
            defaultValue: 'customer'
        },
        // loyalty_points: Số dư điểm hiện tại (denormalize từ loyalty_transactions), INT UNSIGNED, không được null, mặc định là 0
        loyalty_points: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        // total_spent: Tổng chi tiêu (phục vụ phân hạng khách hàng), DECIMAL(15,2), không được null, mặc định là 0.00
        total_spent: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        // status: Trạng thái tài khoản, ENUM('active', 'inactive', 'blocked'), không được null, mặc định là 'active', index
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'blocked'),
            allowNull: false,
            defaultValue: 'active'
        },
        // email_verified_at: Thời điểm xác thực email, DATE, có thể null
        email_verified_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // phone_verified_at: Thời điểm xác thực số điện thoại, DATE, có thể null
        phone_verified_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // failed_login_account: Số lần đăng nhập sai liên tiếp, khóa tài khoản tại 5, TINYINT UNSIGNED -> MySQL, không được null, mặc định là 0
        failed_login_account: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0
        },
        // locked_until: Thời điểm mở khóa tài khoản, DATETIME, có thể null
        locked_until: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // last_login_at: Thời điểm đăng nhập gần nhất, DATETIME, có thể null
        last_login_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // created_at: Thời điểm tạo bản ghi, DATETIME, không được null, mặc định là thời điểm hiện tại, CURRENT_TIMESTAMP 
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        // updated_at: Thời điểm cập nhật bản ghi gần nhất, DATETIME, không được null, mặc định là thời điểm hiện tại, CURRENT_TIMESTAMP ON UPDATE 
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        // deleted_at: Thời điểm xóa mềm bản ghi, DATETIME, có thể null
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'User',
        // Tên bảng trong database, mặc định Sequelize sẽ lấy tên model và chuyển sang dạng số nhiều
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
        indexes: [
            {
                name: 'idx_users_role_status',
                fields: ['role', 'status']
            },
            {
                name: 'idx_users_deleted',
                fields: ['deleted_at']
            },
            {
                name: 'uk_users_phone',
                unique: true,
                fields: ['phone']
            },
            {
                name: 'uk_users_email',
                unique: true,
                fields: ['email']   
            }
        ],
    });
    return User;
}