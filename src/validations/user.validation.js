const Joi = require('joi');

const createAccount = {
    body: Joi.object().keys({
        avatarUrl: Joi.string().optional().allow(null),
        fullName: Joi.string().required().messages({
            'string.empty': "Họ tên không được để trống",
            'any.required': "Họ tên là trường bắt buộc"
        }),
        phone: Joi.string().optional().allow(null),
        account: Joi.string().required().messages({
            'string.empty': "Tài khoản không được để trống",
            'any.required': "Tài khoản là trường bắt buộc"
        }),
        password: Joi.string().required().messages({
            'string.empty': "Mật khẩu không được để trống",
            'any.required': "Mật khẩu là trường bắt buộc"
        }),
        email: Joi.string().optional().allow(null),
        receivedJobDate: Joi.string().optional().allow(null),
        role: Joi.string().required().messages({
            'string.empty': "Vai trò không được để trống",
            'any.required': "Vai trò là trường bắt buộc"    
        }),
        address: Joi.string().optional().allow(null)
    })
}

// Lấy ra danh sách + search
const getQuery = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        searchTerm: Joi.string().optional(),
        role: Joi.string().optional()
    })
}

module.exports = {
    createAccount,
    getQuery
}