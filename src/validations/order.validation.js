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


// Chỉnh sửa
const updateOrder = {
    params: Joi.object().keys({
        id: Joi.string().required()
    }),
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


// Tick/untick 1 sản phẩm trong đơn
const updateProductChecked = {
    params: Joi.object().keys({
        productId: Joi.string().required()
    }),
    body: Joi.object().keys({
        isChecked: Joi.boolean().required().messages({
            'any.required': 'isChecked là trường bắt buộc',
            'boolean.base': 'isChecked phải là kiểu boolean'
        })
    })
}

const updateStatusForCompletedOrder = {
    params: Joi.object().keys({
        id: Joi.string().required()
    }),
    body: Joi.object().keys({
        status: Joi.string().required(),
        approvedBy: Joi.string().required()
    })
}

// tạo đơn giao nhận
const createOrderShipping = {
    body: Joi.object().keys({
    deliveryOrder: Joi.object({
        deliveryOrderCode: Joi.string().required(),
        deliveryDate: Joi.date().required(),
        shippingCarrier: Joi.string().allow(null, ''),
        shippingFee: Joi.string().required(),
        createdBy: Joi.string().uuid().required(),
        orderId: Joi.string().uuid().required()
    }).required(),

    deliveryPerson: Joi.object({
        nameDeliveryPerson: Joi.string().required(),
        phoneDeliveryPerson: Joi.string().required(),
        licensePlate: Joi.string().required(),
        addressGetDelivery: Joi.string().required()
    }).required(),

    recipient: Joi.object({
        nameRecipient: Joi.string().required(),
        phoneRecipient: Joi.string().required(),
        addressReceivedDelivery: Joi.string().required()
    }).required() 
    })
}

// tiếp nhận đơn hàng
const receivedOrderByProEmployee = {
    params: Joi.object().keys({
        orderId: Joi.string().required()
    }),
    body: Joi.object().keys({
        userId: Joi.string().required()
    })
}
module.exports = {
    createOrder,
    updateProductChecked,
    updateStatusForCompletedOrder,
    updateOrder,
    createOrderShipping,
    receivedOrderByProEmployee
}