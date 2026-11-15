'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
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
        sku_code: {
            type: Sequelize.STRING(10),
            allowNull: false
        },
        brand: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        amount: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        category: {
            type: Sequelize.ENUM('smart_device', 'accessory'),
            allowNull: false,
        },
        status: {
            type: Sequelize.ENUM('in_stock', 'out_of_stock', 'restocking'),
            allowNull: false,
            defaultValue: 'in_stock'
        },
      created_at: { type: Sequelize.DATE, allowNull: false},
      updated_at: { type: Sequelize.DATE, allowNull: false}
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Products')
  }
};
