const { StatusCodes } = require('http-status-codes');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const orderService = require('../services/order.service');

// Lấy mã đơn hàng
const handleGenerateOrderCode = catchAsync(async(req, res) => {
    const orderCode = await orderService.getNewOrderCode();
    res.status(StatusCodes.OK).send({ success: true, message: 'Tạo mã đơn hàng thành công.', data: { order_code: orderCode } })
})

// Tạo đơn hàng + sản phẩm
const handleCreateOrderWithProduct = catchAsync(async(req, res) => {
    await orderService.createOrderWithProduct(req.body);
    res.status(StatusCodes.CREATED).send({ success: true, message: "Tạo đơn hàng sản xuất thành công"})
})

// Tạo đơn hàng + sản phẩm
const handleUpdateOrderWithProduct = catchAsync(async(req, res) => {
    await orderService.updateOrderWithProduct(req.params.id, req.body);
    res.status(StatusCodes.OK).send({ success: true, message: "Chỉnh sửa đơn hàng sản xuất thành công"})
})

// Lấy danh sách đơn hàng
const handleGetListOrders = catchAsync(async(req, res) => {
    const queryOptions = pick(req.query, ['page', 'limit', 'searchTerm']);
    const orders = await orderService.getListOrderWithProduct(queryOptions);    
    res.status(StatusCodes.OK).send({ success: true, message: "Lấy danh sách đơn hàng thành công", data: orders })
})

// Lấy danh sách đơn hàng cho nhân viên sản xuất: nhóm theo 3 trạng thái + tổng số lượng từng trạng thái
const handleListOrdersForProductionEmployee = catchAsync(async(req, res) => {
    const list = await orderService.getListOrdersForProductionEmployee();
    res.status(StatusCodes.OK).send({ success: true, message: 'Lấy danh sách thành công', data: list})
})

// Lấy danh sách chi tiết đơn hàng
const handleGetDetailOrderWithProducts = catchAsync(async(req, res) => {
    const order = await orderService.getDetailOrderWithProduct(req.params.id);
    res.status(StatusCodes.OK).send({ success: true, message: 'Lấy thông tin chi tiết thành công. ', data: order })
})

// Tick/untick 1 sản phẩm trong đơn
const handleUpdateProductChecked = catchAsync(async(req, res) => {
    const order = await orderService.updateProductChecked(req.params.productId, req.body.isChecked);
    res.status(StatusCodes.OK).send({ success: true, message: 'Cập nhật trạng thái sản phẩm thành công', data: order })
})

// cập nhật trạng thái đơn hàng hoàn thành
const handleUpdateStatusForCompletedOrder = catchAsync(async(req, res) => {
    await orderService.updateStatusForOrderCompleted(req.params.id, req.body.status);
    res.status(StatusCodes.OK).send({ success: true, message: 'Cập nhật đơn hoàn thành thành công.'})
})

// gửi duyệt cho đơn hoàn thành
const handleSendApprovalForCompletedOrder = catchAsync(async(req, res) => {
    await orderService.sendApprovalForOrderCompleted(req.params.id, req.body.status);
    res.status(StatusCodes.OK).send({ success: true, message: 'Gửi duyệt đơn hoàn thành thành công.'})
})

// Lấy toàn bộ đơn hàng theo trạng thái pending_approval (không phân trang)
const handleGetAllOrders = catchAsync(async(req, res) => {
    const orders = await orderService.getAllOrders();
    res.status(StatusCodes.OK).send({ success: true, message: "Lấy danh sách đơn hàng thành công.", data: orders })
})

// duyệt đơn bởi nhân viên tạo đơn
const handleApprovedByAppEmployee = catchAsync(async(req, res) => {
    await orderService.approvedByAppEmployee(req.params.id, req.body.status);
    res.status(StatusCodes.OK).send({ success: true, message: "Duyệt đơn hàng thành công." })
})

// gửi đơn lên chờ quản lý duyệt
const handleSendApprovalOrderToManager = catchAsync(async(req, res) => {
    await orderService.sendApprovalOrderToManager(req.params.id, req.body.status);
    res.status(StatusCodes.OK).send({ success: true, message: "Gửi duyệt thành công." })
})

// Lấy toàn bộ đơn hàng theo trạng thái pending_manager_approval cho role quản lý (không phân trang)
const handleGetAllOrdersWithStatusPendingManagerApproval = catchAsync(async(req, res) => {
    const orders = await orderService.getAllOrdersWithStatusPendingManagerApproval();
    res.status(StatusCodes.OK).send({ success: true, message: "Lấy danh sách đơn hàng thành công.", data: orders })
}) 

// Lấy toàn bộ đơn hàng theo trạng thái pending_manager_approval cho role quản lý (Có phân trang)
const handleGetAllOrdersPaginatedWithStatusPendingManagerApproval = catchAsync(async(req, res) => {
    const queryOptions = pick(req.query, ['page', 'limit', 'searchTerm']);
    const orders = await orderService.getAllOrdersPaginatedWithStatusPendingManagerApproval(queryOptions);
    res.status(StatusCodes.OK).send({ success: true, message: 'Lấy danh sách đơn hàng thành công.', data: orders})
})

// duyệt đơn bởi quản lý
const handleApprovedByManager= catchAsync(async(req, res) => {
    await orderService.approvedByManager(req.params.id, req.body.status);
    res.status(StatusCodes.OK).send({ success: true, message: "Duyệt đơn hàng thành công." })
})

module.exports = {
    handleGenerateOrderCode,
    handleCreateOrderWithProduct,
    handleGetListOrders,
    handleListOrdersForProductionEmployee,
    handleGetDetailOrderWithProducts,
    handleUpdateProductChecked,
    handleUpdateStatusForCompletedOrder,
    handleSendApprovalForCompletedOrder,
    handleGetAllOrders,
    handleApprovedByAppEmployee,
    handleSendApprovalOrderToManager,
    handleGetAllOrdersWithStatusPendingManagerApproval,
    handleGetAllOrdersPaginatedWithStatusPendingManagerApproval,
    handleApprovedByManager,
    handleUpdateOrderWithProduct
}