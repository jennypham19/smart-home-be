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

// tạo đơn hàng sản xuất
router.post(
    '/order-with-products-created',
    validate(orderValidation.createOrder),
    orderController.handleCreateOrderWithProduct
)

// tạo đơn hàng giao nhận
router.post(
    '/order-shipping-created',
    validate(orderValidation.createOrderShipping),
    orderController.handleCreateOrderShipping
)

// chỉnh sửa đơn hàng 
router.put(
    '/order-with-products-updated/:id',
    validate(orderValidation.updateOrder),
    orderController.handleUpdateOrderWithProduct
)

// Lấy danh sách đơn hàng
router.get(
    '/list-orders-with-products',
    validate(baseValidation.queryOptions),
    orderController.handleGetListOrders
)

// Lấy danh sách đơn hàng chờ tiếp nhận
router.get(
    '/list-received-orders',
    validate(baseValidation.queryOptions),
    orderController.handleGetListReceivedOrders
)

// Lấy danh sách đơn hàng cho nhân viên sản xuất: nhóm theo 3 trạng thái + tổng số lượng từng trạng thái
router.get(
    '/list-orders-for-production-employee/:id',
    validate(baseValidation.queryOption),
    orderController.handleListOrdersForProductionEmployee
)

// Lấy toàn bộ đơn hàng theo trạng thái pending_manager_approval cho role quản lý (không phân trang)
router.get(
    '/orders-with-status-pending-manager-approval',
    orderController.handleGetAllOrdersWithStatusPendingManagerApproval
)

// Lấy toàn bộ đơn hàng theo trạng thái pending_manager_approval cho role quản lý (Có phân trang)
router.get(
    '/orders-paginated-with-status-pending-manager-approval',
    validate(baseValidation.queryOptions),
    orderController.handleGetAllOrdersPaginatedWithStatusPendingManagerApproval
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

// duyệt đơn bởi quản lý
router.patch(
    '/order-approved-by-manager/:id',
    validate(orderValidation.updateStatusForPendingApprovalOrder),
    orderController.handleApprovedByManager
)

// tiếp nhận đơn hàng 
router.patch(
    '/order-received-by-pro-employee/:orderId',
    validate(orderValidation.receivedOrderByProEmployee),
    orderController.handleReceivedOrderByProEmployee
)

// Xóa đơn hàng ở trạng thái chờ phê duyệt
router.delete(
    '/order-with-status-pending-manager-approval-deleted/:id',
    validate(baseValidation.queryOption),
    orderController.handleDeleteOrder
)

// Lấy danh sách đơn hàng giao nhận có trạng thái pending_approval (Chờ phê duyệt)
router.get(
    '/exchange-orders-with-pending-approval',
    validate(baseValidation.queryOptions),
    orderController.handleGetListExchangeOrderWithPendingApproval
)

// Lấy danh sách đơn hàng giao nhận
router.get(
    '/exchange-orders',
    validate(orderValidation.queryOrder),
    orderController.handleGetListExchangeOrders
)

// Lấy danh sách đơn hàng sản xuất theo trạng thái đã duyệt, chờ sản xuất, đang sản xuất, đã sản xuất, bị từ chối
router.get(
    '/list-orders-with-status',
    validate(orderValidation.queryOrder),
    orderController.handleGetListOrdersWithStatus
)
module.exports = router