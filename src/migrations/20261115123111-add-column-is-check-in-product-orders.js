'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('ProductOrders');
    if(!tableDescription.is_checked){
      await queryInterface.addColumn('ProductOrders', 'is_checked', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      })
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProductOrders', 'is_checked')
  }
};
