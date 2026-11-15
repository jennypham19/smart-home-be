'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("Orders", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
        code: {
            type: Sequelize.STRING(10),
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        product_quantity: {
            type: Sequelize.INTEGER,
            allowNull:false
        },
        process: {
            type: Sequelize.STRING,
            allowNull: true
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
            type: Sequelize.ENUM('pending_production', 'in_production', 'production_completed', 'pending_approval', 'approved', 'rejected', 'pending_manager_approval', 'manager_approved', 'manager_rejected'),
            defaultValue: 'pending_production'
        },
        created_by: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
      created_at: { type: Sequelize.DATE, allowNull: false},
      updated_at: { type: Sequelize.DATE, allowNull: false}
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders')
  }
};
