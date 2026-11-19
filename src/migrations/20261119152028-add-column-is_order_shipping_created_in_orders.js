'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Orders');
    if(!tableDescription.is_order_shipping_created){
      await queryInterface.addColumn('Orders', 'is_order_shipping_created', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      })
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Orders', 'is_order_shipping_created')
  }
};
