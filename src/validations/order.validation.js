const Joi = require('joi');
const createOrder = {
    body: Joi.object().keys({
        code: Joi.string().required(),
        name: Joi.string().required().messages({
            'string.empty': 'Tên đơn hàng không được để trống',
            'any.required': 'Tên khách hàng là trường bắt buộc'
        }),
        productQuantity: Joi.number().integer().required(),
        productsOrder: Joi.array().optional(),
        createdBy: Joi.string().required(),
    })
}

module.exports = {
    createOrder,
}