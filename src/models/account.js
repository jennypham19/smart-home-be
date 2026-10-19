'use strict'
const { Model } = require('sequelize');
const { user_role_enum, user_status_enum } = require('./enum');

module.exports = (sequelize, DataTypes) => {
    class Account extends Model {
        static associate(models) {

        }
    }

    Account.init({
        // 1. Cột id: BIGINT tự sinh, là khóa chính
        id: {
            type: DataTypes.UUID, // BIGINT UNSIGNED là dùng trong MySQL, nhưng Sequelize không có kiểu dữ liệu UNSIGNED, nên dùng BIGINT bình thường
            allowNull: false,
            defaultValue: DataTypes.UUIDV7, // dùng thư viện uuid => uuidv7 hoặc Sequelize tự sinh UUID (v7): DataTypes.UUIDV7
            primaryKey: true
        },
        // 2. email: Email, Varchar(255), có thể null, duy nhất khi khác NULL
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        // 3. phone: Số điện thoại - định danh đăng nhập chính, Varchar(20), không được null, duy nhất
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        // 4. password: Mật khẩu, Varchar(255), null nếu chỉ đăng nhập OTP, không null nếu đăng nhập bằng mật khẩu, bcrypt cost >= 12
        password: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        // 5. role: Vai trò trong hệ thống, ENUM ('guest',‘customer’, ‘affiliate’, ‘collaborator’, 'support', 'sales', 'editor', ‘admin’), không được null, mặc định là ‘customer’, index
        role: {
            type: DataTypes.ENUM(...user_role_enum.values),
            allowNull: false,
            defaultValue: user_role_enum.CUSTOMER
        },
        // 6. status: Trạng thái tài khoản, ENUM('pending_verification', 'active', 'inactive', 'suspended', 'blocked', 'banned'), không được null, mặc định là 'pending_verification', index
        status: {
            type: DataTypes.ENUM(...user_status_enum.values),
            allowNull: false,
            defaultValue: user_status_enum.PENDING_VERIFICATION
        },
        // 7. email_verified_at: Thời điểm xác thực email, TIMESTAMPTZ, có thể null
        email_verified_at: {
            type: DataTypes.TIMESTAMPTZ,
            allowNull: true
        },
        // 8. phone_verified_at: Thời điểm xác thực số điện thoại, TIMESTAMPTZ, có thể null
        phone_verified_at: {
            type: DataTypes.TIMESTAMPTZ,
            allowNull: true
        },
        // 9. failed_login_account: Số lần đăng nhập sai liên tiếp, khóa tài khoản tại 5, TINYINT UNSIGNED -> MySQL, không được null, mặc định là 0
        failed_login_account: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0
        },
        // 10. locked_until: Thời điểm mở khóa tài khoản, TIMESTAMPTZ, có thể null
        locked_until: {
            type: DataTypes.TIMESTAMPTZ,
            allowNull: true
        },
        // 11. last_login_at: Thời điểm đăng nhập gần nhất, TIMESTAMPTZ, có thể null
        last_login_at: {
            type: DataTypes.TIMESTAMPTZ,
            allowNull: true
        },
        // 12. last_login_ip: Địa chỉ IP lần đăng nhập gần nhất, có thể null
        last_login_ip: {
            type: DataTypes. INET,
            allowNull: true
        },
        /* - - - Tùy chọn */
        // 13. preferences: Tùy chọn nhận thông báo. VD {“newsletter”: true, “sms_promo”: false}
        preferences: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        // 14. created_at: Thời điểm tạo bản ghi, TIMESTAMPTZ, không được null, mặc định là thời điểm hiện tại, CURRENT_TIMESTAMP 
        created_at: {
            type: DataTypes.TIMESTAMPTZ,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        // 15. updated_at: Thời điểm cập nhật bản ghi gần nhất, TIMESTAMPTZ, không được null, mặc định là thời điểm hiện tại, CURRENT_TIMESTAMP ON UPDATE 
        updated_at: {
            type: DataTypes.TIMESTAMPTZ,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        // 16. deleted_at: Thời điểm xóa mềm bản ghi, TIMESTAMPTZ, có thể null
        deleted_at: {
            type: DataTypes.TIMESTAMPTZ,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Account',
        // Tên bảng trong database, mặc định Sequelize sẽ lấy tên model và chuyển sang dạng số nhiều
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        // paranoid: true sẽ bật chế độ soft delete, Sequelize sẽ không xóa bản ghi mà chỉ đặt deletedAt, mặc định là false
        paranoid: true,
        indexes: [
            {
                name: 'idx_accounts_role_status',
                fields: ['role', 'status']
            },
            {
                name: 'idx_accounts_deleted',
                fields: ['deleted_at']
            },
            {
                name: 'idx_accounts_created_at',
                fields: ['created_at']
            },
            {
                name: 'uk_accounts_phone',
                unique: true,
                fields: ['phone']
            },
            {
                name: 'uk_accounts_email',
                unique: true,
                fields: ['email']   
            },
        ],
    });
    return Account;
}