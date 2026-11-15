const Joi = require('joi');

const createProduct = {
    body: Joi.object().keys({
        skuCode: Joi.string().required().messages({
            'string.empty': "Mã SKU không được để trống",
            'any.required': "Mã SKU là trường bắt buộc"           
        }),
        name: Joi.string().required().messages({
            'string.empty': "Tên sản phẩm không được để trống",
            'any.required': "Tên sản phẩm là trường bắt buộc"
        }),
        brand: Joi.string().required().messages({
            'string.empty': "Thương hiệu không được để trống",
            'any.required': "Thương hiệu là trường bắt buộc"
        }),
        amount: Joi.number().integer().required().messages({
            'string.empty': "Số lượng không được để trống",
            'any.required': "Số lượng là trường bắt buộc"
        }),
        category: Joi.string().required().messages({
            'string.empty': "Danh mục không được để trống",
            'any.required': "Danh mục là trường bắt buộc"    
        }),
        status: Joi.string().required()
    })
}

module.exports = {
    createProduct
}