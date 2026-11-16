'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
        const roles = [
            'application-employee',
            'manager',
            'production-employee',
            'exchange-employee',
        ];

        for (const role of roles) {
            await queryInterface.sequelize.query(`
                ALTER TYPE "enum_Users_role"
                ADD VALUE IF NOT EXISTS '${role}';
            `);
        }

  },

  async down (queryInterface, Sequelize) {
    // PostgreSQL không hỗ trợ DROP VALUE trực tiếp đối với ENUM.
    // Không rollback các giá trị đã thêm.
  }
};
