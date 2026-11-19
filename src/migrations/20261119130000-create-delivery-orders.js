'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('DeliveryOrders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
      delivery_order_code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      delivery_person_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'DeliveryPeople', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      recipient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Recipients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      delivery_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      actual_delivery_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      /*
        1. Chờ duyệt: pending_approval
        2. Chờ lấy hàng: awaiting_pickup
        3. Đã lấy hàng: picked_up
        4. Đang giao: out_for_delivery
        5. Đã giao: delivered
        6. Giao thất bại: delivery_failed
        7. Đã huỷ: cancelled
      */
      delivery_status: {
        type: Sequelize.ENUM('pending_approval', 'awaiting_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'delivery_failed', 'cancelled'),
        defaultValue: 'pending_approval'
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      shipping_fee: {
        type: Sequelize.DECIMAL(15, 0),
        allowNull: false
      },
      shipping_carrier: {
        type: Sequelize.STRING,
        allowNull: true
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('DeliveryOrders');
    // Postgres: xoá luôn kiểu ENUM do Sequelize sinh ra để migrate lại không lỗi "type already exists"
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DeliveryOrders_delivery_status";');
  }
};
