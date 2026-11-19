'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('DeliveryOrders');
    if(!tableDescription.address){
      await queryInterface.addColumn('DeliveryOrders', 'address', {
        type: Sequelize.TEXT,
        allowNull: true
      })
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('DeliveryOrders', 'address')
  }
};
