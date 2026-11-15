'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("Orders");
    if(tableDescription.process){
      // Chuyển dữ liệu cũ sang INTEGER
      await queryInterface.sequelize.query(`
        ALTER TABLE "Orders"
        ALTER COLUMN "process" TYPE INTEGER
          USING (
            CASE
              WHEN "process" ~ '^[0-9]+$'
              THEN "process"::INTEGER
              ELSE 0
            END
          );
      `);
      await queryInterface.changeColumn('Orders', 'process', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      })
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Orders', 'process', {
      type: Sequelize.STRING,
      allowNull: true
    })
  }
};
