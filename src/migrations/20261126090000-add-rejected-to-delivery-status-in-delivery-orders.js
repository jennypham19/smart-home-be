'use strict';

/** @type {import('sequelize-cli').Migration} */
const ENUM_TYPE = 'enum_DeliveryOrders_delivery_status';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Postgres: thêm giá trị 'rejected' vào kiểu ENUM đang tồn tại.
    // IF NOT EXISTS để chạy lại không lỗi "value already exists".
    await queryInterface.sequelize.query(
      `ALTER TYPE "${ENUM_TYPE}" ADD VALUE IF NOT EXISTS 'rejected';`
    );
  },

  async down (queryInterface, Sequelize) {
    // Postgres không hỗ trợ xoá 1 giá trị khỏi ENUM -> tạo lại kiểu không có 'rejected'.
    const valuesWithout = [
      'pending_approval',
      'awaiting_pickup',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'delivery_failed',
      'cancelled'
    ];
    const valuesSql = valuesWithout.map((v) => `'${v}'`).join(', ');

    // Nếu còn bản ghi đang mang giá trị 'rejected' thì không thể rollback an toàn.
    const [rows] = await queryInterface.sequelize.query(
      `SELECT 1 FROM "DeliveryOrders" WHERE "delivery_status" = 'rejected' LIMIT 1;`
    );
    if (rows.length > 0) {
      throw new Error(
        "Không thể rollback: vẫn còn DeliveryOrders có delivery_status = 'rejected'. Hãy cập nhật các bản ghi này trước."
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
