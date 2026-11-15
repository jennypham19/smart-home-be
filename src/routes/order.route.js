const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validate');
const orderController = require('../controllers/order.controller');
const orderValidation = require('../validations/order.validation');
const baseValidation = require('../validations/base.validation');

// API sinh mã đơn hàng
router.get(
    '/generate-order-code',
    orderController.handleGenerateOrderCode
);

router.post(
    '/order-with-products-created',
    validate(orderValidation.createOrder),
    orderController.handleCreateOrderWithProduct
)

router.get(
    '/list-orders-with-products',
    validate(baseValidation.queryOptions),
    orderController.handleGetListOrders
)

router.get(
    '/list-orders-for-production-employee',
    orderController.handleListOrdersForProductionEmployee
)
module.exports = router