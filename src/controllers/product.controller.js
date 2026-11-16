const { StatusCodes } = require('http-status-codes');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const productService = require('../services/product.service');

// Tạo tài khoản
const createProduct = catchAsync(async(req, res) => {
    const product = await productService.createdProduct(req.body);
    res.status(StatusCodes.CREATED).send({ success: true, message: 'Tạo sản phẩm thành công.', data: product })
})

// Lấy ra danh sách + search tài khoản
const getListProducts = catchAsync(async (req, res) => {
    const queryOptions = pick(req.query, ['page', 'limit', 'searchTerm']);
    const products = await productService.queryListProducts(queryOptions);
    res.status(StatusCodes.OK).send({ success: true, message: 'Lấy danh sách thành công.', data: products})
})

// Lấy toàn bộ sản phẩm (không phân trang)
const handleGetAllProducts = catchAsync(async(req, res) => {
    const allProducts = await productService.getAllProducts();
    res.status(StatusCodes.OK).send({ success: true, message: 'Lấy danh sách thành công.', data: allProducts })
})
module.exports = {
    createProduct,
    getListProducts,
    handleGetAllProducts
}