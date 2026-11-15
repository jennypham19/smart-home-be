'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');
    if(!tableDescription.avatar_url){
      await queryInterface.addColumn('Users', 'avatar_url', {
        type: Sequelize.TEXT,
        allowNull: true
      })
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'avatar_url')
  }
};
