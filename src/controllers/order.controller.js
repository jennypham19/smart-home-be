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
module.exports = {
    handleGenerateOrderCode,
    handleCreateOrderWithProduct,
    handleGetListOrders,
    handleListOrdersForProductionEmployee
}