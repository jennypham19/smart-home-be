'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`
            CREATE SEQUENCE IF NOT EXISTS order_code_seq
            START WITH 0
            INCREMENT BY 1
            MINVALUE 0;
        `);
  },

  async down (queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`
            DROP SEQUENCE IF EXISTS order_code_seq;
        `);
  }
};
