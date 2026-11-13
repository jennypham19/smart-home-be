'use strict';
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableName = 'Users';
    const adminAccount = 'admin';
    const existingAdmin = await queryInterface.sequelize.query(
      `SELECT account from "${tableName}" WHERE account = :account LIMIT 1`,
      {
        replacements: { account: adminAccount },
        type: Sequelize.QueryTypes.SELECT,
        plain: true
      }
    );

    if(!existingAdmin){
      // Băm mật khẩu
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);

      await queryInterface.bulkInsert(tableName, [{
        id: uuidv4(),
        account: adminAccount,
        password: hashedPassword,
        full_name: "Admin",
        role: 'admin',
        email: null,
        phone: null,
        address: null,
        status: 1,
        received_jod_date: new Date(),
        is_deleted: 1,
        created_at: new Date(),
        updated_at: new Date()
      }], {});
      console.log(`Successfully inserted initial admin user: '${adminAccount}'`);
    } else {
      console.log(`Initial admin user '${adminAccount}' already exists. Skipping.`);
    }
  },

  async down (queryInterface, Sequelize) {
    // Giữ nguyên logic down, nó đã đúng
    await queryInterface.bulkDelete('Users', { account: 'admin' });
    console.log(`Successfully deleted initial admin user: 'admin'`);
  }
};
