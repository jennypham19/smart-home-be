'use strict';

/** @type {import('sequelize-cli').Migration} */
const ENUM_TYPE = 'enum_DeliveryOrders_delivery_status';
const NEW_VALUES = ['manager_approved', 'manager_rejected'];

module.exports = {
  async up (queryInterface, Sequelize) {
    // Postgres: thêm các giá trị mới vào kiểu ENUM đang tồn tại.
    // IF NOT EXISTS để chạy lại không lỗi "value already exists".
    for (const value of NEW_VALUES) {
      await queryInterface.sequelize.query(
        `ALTER TYPE "${ENUM_TYPE}" ADD VALUE IF NOT EXISTS '${value}';`
      );
    }
  },

  async down (queryInterface, Sequelize) {
    // Postgres không hỗ trợ xoá 1 giá trị khỏi ENUM -> tạo lại kiểu không có 2 giá trị mới.
    const valuesWithout = [
      'pending_approval',
      'awaiting_pickup',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'delivery_failed',
      'cancelled',
      'rejected'
    ];
    const valuesSql = valuesWithout.map((v) => `'${v}'`).join(', ');
    const newValuesSql = NEW_VALUES.map((v) => `'${v}'`).join(', ');

    // Nếu còn bản ghi đang mang các giá trị mới thì không thể rollback an toàn.
    const [rows] = await queryInterface.sequelize.query(
      `SELECT 1 FROM "DeliveryOrders" WHERE "delivery_status" IN (${newValuesSql}) LIMIT 1;`
    );
    if (rows.length > 0) {
      throw new Error(
        "Không thể rollback: vẫn còn DeliveryOrders có delivery_status là 'manager_approved' hoặc 'manager_rejected'. Hãy cập nhật các bản ghi này trước."
      );
    }

    await queryInterface.sequelize.query('BEGIN;');
    try {
      await queryInterface.sequelize.query(
        `ALTER TYPE "${ENUM_TYPE}" RENAME TO "${ENUM_TYPE}_old";`
      );
      await queryInterface.sequelize.query(
        `CREATE TYPE "${ENUM_TYPE}" AS ENUM(${valuesSql});`
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "DeliveryOrders" ALTER COLUMN "delivery_status" DROP DEFAULT;`
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "DeliveryOrders" ALTER COLUMN "delivery_status" TYPE "${ENUM_TYPE}" USING "delivery_status"::text::"${ENUM_TYPE}";`
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "DeliveryOrders" ALTER COLUMN "delivery_status" SET DEFAULT 'pending_approval';`
      );
      await queryInterface.sequelize.query(`DROP TYPE "${ENUM_TYPE}_old";`);
      await queryInterface.sequelize.query('COMMIT;');
    } catch (error) {
      await queryInterface.sequelize.query('ROLLBACK;');
      throw error;
    }
  }
};
