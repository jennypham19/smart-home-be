const { StatusCodes } = require('http-status-codes');
const bcrypt  = require('bcryptjs');
const crypto = require('crypto');
const { Product } = require('../models');
const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');

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

module.exports = {
    createdProduct,
    queryListProducts
}