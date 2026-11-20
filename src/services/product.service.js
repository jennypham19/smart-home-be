const { StatusCodes } = require('http-status-codes');
const { Product, ProductOrder } = require('../models');
const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');
const { broadcast } = require('../config/websocket');

// Lấy chi tiết product theo id
const getProductById = async(id) => {
    const product = await Product.findByPk(id);
    if(!product){
       throw new ApiError(StatusCodes.NOT_FOUND, `Không tồn tại bản ghi sản phẩm có tên là ${product.name}`); 
    }
    return product
}

// Tạo tài khoản
const createdProduct = async(productBody) => {
    const { skuCode, name, brand, amount, category, status } = productBody;
    try {
        // Insert thông tin để tạo bản ghi
        const product = await Product.create({
            sku_code: skuCode,
            name, brand, amount, category, status
        });
        return product;
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message)
    }
}

// Lấy ra danh sách thông tin sản phẩm
const queryListProducts = async(queryOptions) => {
    try {
        const { page, limit, searchTerm } = queryOptions;
        const offset = (page - 1) * limit;
        // const whereClause = { is_deleted: 1};
        // if(role && role !== 'all'){
        //     whereClause.role = role;
        // }
        // if(searchTerm){
        //     whereClause[Op.or] = [
        //         { full_name: { [Op.iLike]: `%${searchTerm}%` }},
        //         { account: { [Op.iLike]: `%${searchTerm}%` }}
        //     ]
        // };

        const { count, rows: productsDB } = await Product.findAndCountAll({
            // where: whereClause,
            limit,
            offset,
            order: [[ 'created_at', 'DESC']]
        })
        const totalPages = Math.ceil(count/limit);
        const products = productsDB.map((product) => {
            const newProduct = product.toJSON();
            return {
                id: newProduct.id,
                name: newProduct.name,
                skuCode: newProduct.sku_code,
                brand: newProduct.brand,
                amount: newProduct.amount,
                category: newProduct.category,
                status: newProduct.status,
                createdAt: newProduct.created_at,
                updatedAt: newProduct.updated_at,
            }
        })
        return {
            data: products,
            totalPages,
            currentPage: page,
            total: count
        }
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi khi lấy ra danh sách: ' + error.message);
    }
}

// Lấy toàn bộ sản phẩm (không phân trang) - dùng cho broadcast realtime
const getAllProducts = async() => {
    try {
        const productsDB = await Product.findAll({
            order: [['created_at', 'DESC']]
        });
        return productsDB.map((product) => {
            const newProduct = product.toJSON();
            return {
                id: newProduct.id,
                name: newProduct.name,
                skuCode: newProduct.sku_code,
                brand: newProduct.brand,
                amount: newProduct.amount,
                category: newProduct.category,
                status: newProduct.status,
                createdAt: newProduct.created_at,
                updatedAt: newProduct.updated_at,
            }
        });
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi khi lấy toàn bộ sản phẩm: ' + error.message);
    }
}

// Lấy dữ liệu mới nhất và broadcast tới tất cả client để cập nhật lại amount của product
const emitAmountProductUpdated = async() => {
    try {
        const products = await getAllProducts();
        broadcast('amount_product:updated', { data: products, total: products.length })
    } catch (error) {
        // Không để lỗi broadcast làm hỏng luồng chính
        console.error('Lỗi khi broadcast amount_product:updated: ' + error.message);
    }
}

// Xóa sản phẩm
const deleteProduct = async(id) => {
    try {
        const productDB = await Product.findByPk(id);
        // Kiểm tra sản phẩm có tồn tại không
        if (!productDB) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy sản phẩm");
        }

        // Kiểm tra sản phẩm đã xuất hiện trong đơn sản xuất chưa
        const producOrderDB = await ProductOrder.findAll({
            where: { sku_code: productDB.sku_code }
        });
        if(producOrderDB.length > 0){
            throw new ApiError(StatusCodes.BAD_REQUEST, `Không thể xóa sản phẩm ${productDB.name} do đã được xuất hiện trong đơn sản xuất`)
        }

        // Xóa sản phẩm
        await productDB.destroy()
        await emitAmountProductUpdated()
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message); 
    }
}

// Chỉnh sửa sản phẩm
const updateProduct = async(id, productBody) => {
    try {
        const { skuCode, name, brand, amount, category, status } = productBody;
        const productDB = await Product.findByPk(id);
        await productDB.update({
            sku_code: skuCode,
            name, brand, amount, category, status
        })
        await emitAmountProductUpdated()
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message); 
    }
}

module.exports = {
    createdProduct,
    queryListProducts,
    getAllProducts,
    emitAmountProductUpdated,
    deleteProduct,
    updateProduct
}