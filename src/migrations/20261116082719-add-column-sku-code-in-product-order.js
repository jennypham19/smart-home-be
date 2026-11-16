'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('ProductOrders');
    if(!tableDescription.sku_code){
      await queryInterface.addColumn('ProductOrders', 'sku_code', {
        type: Sequelize.STRING(10),
        allowNull: true
      })
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProductOrders', 'sku_code')
  }
};
