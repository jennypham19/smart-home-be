'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('ProductOrders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        quantity: {
            type: Sequelize.INTEGER,
            allowNull:false
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        order_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'Orders', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
      created_at: { type: Sequelize.DATE, allowNull: false},
      updated_at: { type: Sequelize.DATE, allowNull: false}
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('ProductOrders')
  }
};
