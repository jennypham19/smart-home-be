'use strict'
const { Model } = require('sequelize');
const { user_role_enum, user_status_enum, gender_enum, loyalty_tier_enum } = require('./enum');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {

        }
    }

    User.init({
        // 1. Cột id: BIGINT tự sinh, là khóa chính
        id: {
            type: DataTypes.BIGINT, // BIGINT UNSIGNED là dùng trong MySQL, nhưng Sequelize không có kiểu dữ liệu UNSIGNED, nên dùng BIGINT bình thường
            allowNull: false,
            autoIncrement: true,
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
        // 5. full_name: Họ tên đầy đủ, Varchar(150), không được null
        full_name: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        // 6. avatar_url: Đường dẫn ảnh đại diện, varchar(500), có thể null
        avatar_url: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        // 7. gender: Giới tính, ENUM('male', 'female', 'other'), có thể null
        gender: {
            type: DataTypes.ENUM(...gender_enum.values),
            allowNull: true
        },
        // 8. date_of_birth: Ngày sinh (phục vụ ưu đãi sinh nhật), DATE, có thể null
        date_of_birth: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // 9. role: Vai trò trong hệ thống, ENUM ('guest',‘customer’, ‘affiliate’, ‘collaborator’, 'support', 'sales', 'editor', ‘admin’), không được null, mặc định là ‘customer’, index
        role: {
            type: DataTypes.ENUM(...user_role_enum.values),
            allowNull: false,
            defaultValue: user_role_enum.CUSTOMER
        },
        // 10. status: Trạng thái tài khoản, ENUM('pending_verification', 'active', 'inactive', 'suspended', 'blocked', 'banned'), không được null, mặc định là 'pending_verification', index
        status: {
            type: DataTypes.ENUM(...user_status_enum.values),
            allowNull: false,
            defaultValue: user_status_enum.PENDING_VERIFICATION
        },
        // 11. email_verified_at: Thời điểm xác thực email, DATE, có thể null
        email_verified_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // 12. phone_verified_at: Thời điểm xác thực số điện thoại, DATE, có thể null
        phone_verified_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        /* - - - Chương trình khách hàng thân thiết */
        // 13. loyalty_points: Số dư điểm hiện tại (denormalize từ loyalty_transactions), INT UNSIGNED, không được null, mặc định là 0
        loyalty_points: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        // 14. loyalty_tier: Hạng thành viên, xét theo total_spent, ENUM('bronze', 'silver', 'gold', 'platinum')
        loyalty_tier: {
           type: DataTypes.ENUM(...loyalty_tier_enum.values),
           allowNull: true,
           defaultValue: loyalty_tier_enum.BRONZE
        },
        // 15. total_spent: Tổng chi tiêu (phục vụ phân hạng khách hàng), DECIMAL(15,2), không được null, mặc định là 0.00
        total_spent: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        /* - - - Cộng tác viên */
        // 16. is_collaborator:
        is_collaborator: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        // 17. collaborator_since
        // 18. commission_rate
        // 19. referrral_code
        // 20. referred_by_id
        /* - - - Bảo mật */
        // 21. failed_login_account: Số lần đăng nhập sai liên tiếp, khóa tài khoản tại 5, TINYINT UNSIGNED -> MySQL, không được null, mặc định là 0
        failed_login_account: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0
        },
        // 22. locked_until: Thời điểm mở khóa tài khoản, DATETIME, có thể null
        locked_until: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // 23. last_login_at: Thời điểm đăng nhập gần nhất, DATETIME, có thể null
        last_login_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // 24. last_login_ip
        /* - - - Tùy chọn */
        // 25. preferences
        // 26. created_at: Thời điểm tạo bản ghi, DATETIME, không được null, mặc định là thời điểm hiện tại, CURRENT_TIMESTAMP 
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        // 27. updated_at: Thời điểm cập nhật bản ghi gần nhất, DATETIME, không được null, mặc định là thời điểm hiện tại, CURRENT_TIMESTAMP ON UPDATE 
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        // 28. deleted_at: Thời điểm xóa mềm bản ghi, DATETIME, có thể null
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
                name: 'idx_users_created_at',
                fields: ['created_at']
            },
            {
                name: 'idx_users_collaborator',
                fields: ['is_collaborator']
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
            },
            {
                name: 'uq_users_referral',
                unique: true,
                fields: ['referral_code']
            }
        ],
    });
    return User;
}