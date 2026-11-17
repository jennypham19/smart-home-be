const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validate');
const orderController = require('../controllers/order.controller');
const orderValidation = require('../validations/order.validation');
const baseValidation = require('../validations/base.validation');

// Lấy toàn bộ đơn hàng sản xuất theo trạng thái pending_approval (không phân trang)
router.get(
    '/list-production-orders-with-status',
    orderController.handleGetAllOrders
)

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

router.get(
    '/detail-orders-with-products/:id',
    validate(baseValidation.queryOption),
    orderController.handleGetDetailOrderWithProducts
)

// Tick/untick 1 sản phẩm trong đơn (trừ/hoàn kho + cập nhật process/status + realtime)
router.patch(
    '/products/:productId/checked',
    validate(orderValidation.updateProductChecked),
    orderController.handleUpdateProductChecked
)

// cập nhật trạng thái đơn hàng hoàn thành
router.patch(
    '/order-completed/:id',
    validate(orderValidation.updateStatusForCompletedOrder),
    orderController.handleUpdateStatusForCompletedOrder
)

// gửi duyệt cho đơn hoàn thành
router.patch(
    '/order-sent-approval/:id',
    validate(orderValidation.updateStatusForCompletedOrder),
    orderController.handleSendApprovalForCompletedOrder
)

// duyệt đơn bởi nhân viên tạo đơn
router.patch(
    '/order-approved-by-app-employee/:id',
    validate(orderValidation.updateStatusForCompletedOrder),
    orderController.handleApprovedByAppEmployee
)

// gửi đơn lên chờ quản lý duyệt
router.patch(
    '/order-sent-approval-to-manager/:id',
    validate(orderValidation.updateStatusForCompletedOrder),
    orderController.handleSendApprovalOrderToManager
)

module.exports = router