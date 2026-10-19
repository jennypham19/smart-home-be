'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    // =====================================================
    // 1. USERS TABLE
    // =====================================================
    await queryInterface.createTable('Accounts', {
        // Cột id: BIGINT tự sinh, là khóa chính
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'), // Nếu dùng PostgreSQL, tạo UUID bằng pgcrypto
        // hoặc với MySQL: Sequelize.literal('(UUID())')
        primaryKey: true,
        allowNull: false
      },
      // 2. email: Email, Varchar(255), có thể null, duy nhất khi khác NULL
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      // 3. phone: Số điện thoại - định danh đăng nhập chính, Varchar(20), không được null, duy nhất
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      // 4. password: Mật khẩu, Varchar(255), null nếu chỉ đăng nhập OTP, không null nếu đăng nhập bằng mật khẩu, bcrypt cost >= 12
      password: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      // 5. role: Vai trò trong hệ thống, ENUM ('guest',‘customer’, ‘affiliate’, ‘collaborator’, 'support', 'sales', 'editor', ‘admin’), không được null, mặc định là ‘customer’, index
      role: {
        type: Sequelize.ENUM('guest', 'customer', 'affiliate', 'collaborator', 'support', 'sales', 'editor', 'admin'),
        allowNull: false,
        defaultValue: 'customer'
      },
      // 6. status: Trạng thái tài khoản, ENUM('pending_verification', 'active', 'inactive', 'suspended', 'blocked', 'banned'), không được null, mặc định là 'pending_verification', index
      status: {
        type: Sequelize.ENUM('pending_verification', 'active', 'inactive', 'suspended', 'blocked', 'banned'),
        allowNull: false,
        defaultValue: 'pending_verification'
      },
      // 7. email_verified_at: Thời điểm xác thực email, DATE, có thể null
      email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // 8. phone_verified_at: Thời điểm xác thực số điện thoại, DATE, có thể null
      phone_verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // 9. failed_login_account: Số lần đăng nhập sai liên tiếp, khóa tài khoản tại 5, TINYINT UNSIGNED -> MySQL, không được null, mặc định là 0
      failed_login_account: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 0
      },
      // 10. locked_until: Thời điểm mở khóa tài khoản, DATE, có thể null
      locked_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // 11. last_login_at: Thời điểm đăng nhập gần nhất, DATE, có thể null
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // 12. last_login_ip: Địa chỉ IP lần đăng nhập gần nhất, có thể null
      last_login_ip: {
        type: Sequelize.INET,
        allowNull: true
      },
      /* - - - Tùy chọn */
      // 13. preferences: Tùy chọn nhận thông báo. VD {“newsletter”: true, “sms_promo”: false}
      preferences: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      // 14. created_at: Thời điểm tạo bản ghi, DATE, không được null, mặc định là thời điểm hiện tại, CURRENT_TIMESTAMP 
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      // 15. updated_at: Thời điểm cập nhật bản ghi gần nhất, DATE, không được null, mặc định là thời điểm hiện tại, CURRENT_TIMESTAMP ON UPDATE 
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      // 16. deleted_at: Thời điểm xóa mềm bản ghi, DATE, có thể null
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    })
    // =====================================================
    // 2. UNIQUE INDEXES
    // =====================================================

    // Unique phone: chỉ áp dụng cho tài khoản chưa bị xóa mềm
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX uk_accounts_phone
      ON "Accounts" ("phone")
      WHERE "deleted_at" IS NULL
    `)

    // Unique email: cho phép nhiều giá trị NULL.
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX uk_accounts_email
      ON "Accounts" ("email")
      WHERE "email" IS NOT NULL 
        AND "deleted_at" IS NULL
    `)
    // await queryInterface.addIndex('Accounts', ['phone'], {
    //   name: 'uk_accounts_phone',
    //   unique: true
    // });

    // await queryInterface.addIndex('Accounts', ['email'], {
    //   name: 'uk_accounts_email',
    //   unique: true
    // });

    // =====================================================
    // 3. INDEXES
    // =====================================================     
    await queryInterface.addIndex(
      'Accounts', 
      ['role', 'status'], 
      { name: 'idx_accounts_role_status'}
    );

    await queryInterface.addIndex(
      'Accounts', 
      ['deleted_at'], 
      { name: 'idx_accounts_deleted'}
    );
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('Accounts');
    
    // Nếu PostgreSQL không tự xóa các ENUM type được tạo,
    // cần xóa các type còn tồn tại sau khi drop bảng.
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Accounts_role";
    `)

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Accounts_status"
    `)
  }
};
