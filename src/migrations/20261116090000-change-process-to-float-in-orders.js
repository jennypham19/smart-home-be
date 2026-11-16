'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Đổi process sang FLOAT để lưu tiến độ có 1 chữ số thập phân (vd 33.3%)
    await queryInterface.changeColumn('Orders', 'process', {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Orders', 'process', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });
  }
};
