'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('DeliveryOrders');

    if(!tableDescription.assigned_to){
      await queryInterface.addColumn('DeliveryOrders', 'assigned_to', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('DeliveryOrders', 'assigned_to');
  }
};
