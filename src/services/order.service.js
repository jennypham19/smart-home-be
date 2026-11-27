const { StatusCodes } = require('http-status-codes');
const { Order, ProductOrder, Product, DeliveryOrder, DeliveryPerson, Recipient, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { Op, QueryTypes } = require('sequelize');
const db = require('../models');
const { broadcast } = require('../config/websocket');
const productService = require('../services/product.service');

// Lấy mã đơn hàng
const getNewOrderCode = async() => {
    try {
        const result = await db.sequelize.query(
            `
                SELECT 'DH-' || LPAD(
                    nextval('order_code_seq')::TEXT,
                    4,
                    '0'
                ) AS order_code
            `,
            {
                type: QueryTypes.SELECT,
                plain: true
            }
        );

        return result.order_code
    } catch (error) {
        throw ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message)
    }
}


// Tạo đơn hàng + sản phẩm
const createOrderWithProduct = async(orderBody) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { code, name, productQuantity, productsOrder, createdBy } = orderBody;
        // 1. Tạo mới order
        const order = await Order.create({
            code, name, product_quantity: productQuantity, created_by: createdBy, status: 'pending_manager_approval'
        }, { transaction });

        // 2. Lưu sản phẩm đơn hàng
        for(const product of productsOrder){
            await ProductOrder.create({
                sku_code: product.skuCode,
                name: product.name,
                quantity: product.quantity,
                description: product.description,
                order_id: order.id
            }, { transaction })
        }
        await transaction.commit();

        await emitAllOrderUpdated();
    } catch (error) {
        await transaction.rollback();
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message)
    }
}

// Chỉnh sửa đơn hàng + sản phẩm
const updateOrderWithProduct = async(id, orderBody) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { code, name, productQuantity, productsOrder, createdBy } = orderBody;
        // 1. Lấy thông tin đơn hàng
        const orderDB = await Order.findByPk(id, { transaction });
        if(!orderDB) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Không tồn tại bản ghi nào.")
        }
        // 2. Cập nhật lại thông tin order
        await orderDB.update({
            code,
            name,
            product_quantity: productQuantity,
            created_by: createdBy
        }, { transaction });

        // 3. Xóa danh sách sản phẩm cũ của đơn hàng
        await ProductOrder.destroy({
            where: {
                order_id: id
            },
            transaction
        });

        // 4. Thêm danh sách sản phẩm mới
        if (productsOrder?.length > 0) {
            const productData = productsOrder.map((product) => ({
                sku_code: product.skuCode,
                name: product.name,
                quantity: product.quantity,
                description: product.description,
                order_id: id
            }));

            await ProductOrder.bulkCreate(productData, {
                transaction
            });
        }

        // 5. Commit transaction
        await transaction.commit();

        await emitOrdersUpdated();
        await emitAllOrderUpdated()
    } catch (error) {
        await transaction.rollback();
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message)
    }
}

// Tạo đơn hàng giao nhận
const createOrderShipping = async(orderBody) => {
    const transaction = await db.sequelize.transaction();
    try {
        const { deliveryOrder, deliveryPerson, recipient } = orderBody 
        // 1. Kiểm tra xem thông tin người giao hàng và người nhận hàng có tồn tại không thông qua phone
        const deliveryPersonDB = await DeliveryPerson.findOne({
            where: { phone: deliveryPerson.phoneDeliveryPerson },
            transaction, 
        })
        const recipientDB = await Recipient.findOne({
            where: { phone: recipient.phoneRecipient },
            transaction
        })

        // 1.1. Nếu tồn tại thì không thêm mới, chỉ thêm mới bản ghi deliveryOrder
        if(deliveryPersonDB && recipientDB){
            // Tạo đơn giao nhận
            await DeliveryOrder.create({
                delivery_order_code: deliveryOrder.deliveryOrderCode,
                order_id: deliveryOrder.orderId,
                delivery_person_id: deliveryPersonDB.id,
                recipient_id: recipientDB.id,
                delivery_date: deliveryOrder.deliveryDate,
                shipping_fee: deliveryOrder.shippingFee,
                shipping_carrier: deliveryOrder.shippingCarrier ? deliveryOrder.shippingCarrier : null,
                created_by: deliveryOrder.createdBy,
                address: deliveryPerson.addressGetDelivery
            }, { transaction })
        }

        // 1.2. Nếu không tồn tại thì thêm cả 3 bản ghi
        if(!deliveryPersonDB && !recipientDB){
            // Tạo người giao hàng
            const newDeliveryPersonDB = await DeliveryPerson.create({
                full_name: deliveryPerson.nameDeliveryPerson,
                phone: deliveryPerson.phoneDeliveryPerson,
                license_plate: deliveryPerson.licensePlate
            }, { transaction })

            // Tạo người nhận hàng
            const newRecipientDB = await Recipient.create({
                full_name: recipient.nameRecipient,
                phone: recipient.phoneRecipient,
                address: recipient.addressReceivedDelivery
            }, { transaction })

            // Tạo đơn giao nhận
            await DeliveryOrder.create({
                delivery_order_code: deliveryOrder.deliveryOrderCode,
                order_id: deliveryOrder.orderId,
                delivery_person_id: newDeliveryPersonDB.id,
                recipient_id: newRecipientDB.id,
                delivery_date: deliveryOrder.deliveryDate,
                shipping_fee: deliveryOrder.shippingFee,
                shipping_carrier: deliveryOrder.shippingCarrier ? deliveryOrder.shippingCarrier : null,
                created_by: deliveryOrder.createdBy,
                address: deliveryPerson.addressGetDelivery
            }, { transaction })
        }

        // 2. Cập nhật trường is_order_shipping_created trong bảng Orders
        const orderDB = await Order.findByPk(deliveryOrder.orderId, { transaction });
        orderDB.is_order_shipping_created = true,
        await orderDB.save({ transaction })

        // 3. Xác nhận transaction
        await transaction.commit();
        await emitOrdersUpdated()
    } catch (error) {
        await transaction.rollback();
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message);  
    }
}

// Lấy dữ liệu mới nhất và broadcast tới tất cả client để cập nhật data + statusCounts realtime
const emitProductionOrdersUpdated = async(id) => {
    try {
        const list = await getListOrdersForProductionEmployee(id);
        broadcast('production_orders:updated', list);
    } catch (error) {
        // Không để lỗi broadcast làm hỏng luồng chính (đơn đã được tạo thành công)
        console.error('Lỗi khi broadcast production_orders:updated: ' + error.message);
    }
}


const emitOrdersUpdated = async() => {
    try {
        const data = await getListOrderWithProduct({ page: 1, limit: 1000 });
        broadcast('orders:updated', data);
    } catch (error) {
        // Không để lỗi broadcast làm hỏng luồng chính (đơn đã được tạo thành công)
        console.error('Lỗi khi broadcast production_orders:updated: ' + error.message);
    }
}

const emitAllOrderUpdated = async() => {
    try {
        const data = await getAllOrders();
    } catch (error) {
        // Không để lỗi broadcast làm hỏng luồng chính (đơn đã được tạo thành công)
        console.error('Lỗi khi broadcast production_orders:updated: ' + error.message);
    }
}

// Lấy danh sách đơn hàng + sản phẩm
const getListOrderWithProduct = async(queryOptions) => {
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

        const { count, rows: ordersBD } = await Order.findAndCountAll({
            // where: whereClause,
            include: [
                {
                    model: ProductOrder,
                    as: 'OrderProducts'
                }
            ],
            limit,
            offset,
            order: [[ 'created_at', 'DESC']],
            distinct: true
        })
        const totalPages = Math.ceil(count/limit);
        const orders = ordersBD.map((order) => {
            const newOrder = order.toJSON();
            return {
                id: newOrder.id,
                code: newOrder.code,
                name: newOrder.name,
                productQuantity: newOrder.product_quantity,
                process: newOrder.process,
                status: newOrder.status,
                createdBy: newOrder.created_by,
                isOrderShippingCreated: newOrder.is_order_shipping_created,
                products: (newOrder.OrderProducts ?? [])
                    .filter((el) => el.order_id === newOrder.id)
                    .map((product) => {
                        return{
                            id: product.id,
                            name: product.name,
                            skuCode: product.sku_code,
                            quantity: product.quantity,
                            description: product.description,
                            isChecked: product.is_checked,
                            createdAt: product.created_at,
                            updatedAt: product.updated_at,
                        }
                    }),
                createdAt: newOrder.created_at,
                updatedAt: newOrder.updated_at,
            }
        })
        return {
            data: orders,
            totalPages,
            currentPage: page,
            total: count
        }
        
        
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi khi lấy ra danh sách: ' + error.message);
    }
}

// Lấy danh sách đơn hàng + sản phẩm có trạng thái chờ sản xuất
const getListReceivedOrder = async(queryOptions) => {
    try {
        const { page, limit, searchTerm } = queryOptions;
        const offset = (page - 1) * limit;
        const whereClause = { status:  'manager_approved' };
        if(searchTerm){
            whereClause[Op.or] = [
                { code: { [Op.iLike]: `%${searchTerm}%` }},
                { name: { [Op.iLike]: `%${searchTerm}%` }}
            ]
        };

        const { count, rows: ordersBD } = await Order.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: ProductOrder,
                    as: 'OrderProducts'
                }
            ],
            limit,
            offset,
            order: [[ 'created_at', 'DESC']],
            distinct: true
        })
        const totalPages = Math.ceil(count/limit);
        const orders = ordersBD.map((order) => {
            const newOrder = order.toJSON();
            return {
                id: newOrder.id,
                code: newOrder.code,
                name: newOrder.name,
                productQuantity: newOrder.product_quantity,
                process: newOrder.process,
                status: newOrder.status,
                createdBy: newOrder.created_by,
                assignedTo: newOrder.assigned_to,
                isOrderShippingCreated: newOrder.is_order_shipping_created,
                products: (newOrder.OrderProducts ?? [])
                    .filter((el) => el.order_id === newOrder.id)
                    .map((product) => {
                        return{
                            id: product.id,
                            name: product.name,
                            skuCode: product.sku_code,
                            quantity: product.quantity,
                            description: product.description,
                            isChecked: product.is_checked,
                            createdAt: product.created_at,
                            updatedAt: product.updated_at,
                        }
                    }),
                createdAt: newOrder.created_at,
                updatedAt: newOrder.updated_at,
            }
        })
        return {
            data: orders,
            totalPages,
            currentPage: page,
            total: count
        }
        
        
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi khi lấy ra danh sách: ' + error.message);
    }
}

// Lấy toàn bộ đơn hàng theo trạng thái approved (không phân trang)
const getAllOrders = async() => {
    try {
        const orderDB = await Order.findAll({
            where: {
                status: 'production_completed'
            },
            include: [
                {
                    model: ProductOrder,
                    as: 'OrderProducts'
                }
            ],
            order: [[ 'created_at', 'DESC']],
            distinct: true
        });
        return orderDB.map((order) => {
            const newOrder = order.toJSON();
            return {
                id: newOrder.id,
                code: newOrder.code,
                name: newOrder.name,
                productQuantity: newOrder.product_quantity,
                process: newOrder.process,
                status: newOrder.status,
                createdBy: newOrder.created_by,
                isOrderShippingCreated: newOrder.is_order_shipping_created,
                products: (newOrder.OrderProducts ?? [])
                    .filter((el) => el.order_id === newOrder.id)
                    .map((product) => {
                        return{
                            id: product.id,
                            name: product.name,
                            skuCode: product.sku_code,
                            quantity: product.quantity,
                            description: product.description,
                            isChecked: product.is_checked,
                            createdAt: product.created_at,
                            updatedAt: product.updated_at,
                        }
                    }),
                createdAt: newOrder.created_at,
                updatedAt: newOrder.updated_at,
            }
        });
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi khi lấy toàn bộ đơn hàng: ' + error.message);
    }
}

// Lấy toàn bộ đơn hàng theo trạng thái pending_manager_approval cho role quản lý (không phân trang)
const getAllOrdersWithStatusPendingManagerApproval = async() => {
    try {
        const orderDB = await Order.findAll({
            where: {
                status: 'pending_manager_approval'
            },
            include: [
                {
                    model: ProductOrder,
                    as: 'OrderProducts'
                }
            ],
            order: [[ 'created_at', 'DESC']],
            distinct: true
        });
        return orderDB.map((order) => {
            const newOrder = order.toJSON();
            return {
                id: newOrder.id,
                code: newOrder.code,
                name: newOrder.name,
                productQuantity: newOrder.product_quantity,
                process: newOrder.process,
                status: newOrder.status,
                createdBy: newOrder.created_by,
                isOrderShippingCreated: newOrder.is_order_shipping_created,
                products: (newOrder.OrderProducts ?? [])
                    .filter((el) => el.order_id === newOrder.id)
                    .map((product) => {
                        return{
                            id: product.id,
                            name: product.name,
                            skuCode: product.sku_code,
                            quantity: product.quantity,
                            description: product.description,
                            isChecked: product.is_checked,
                            createdAt: product.created_at,
                            updatedAt: product.updated_at,
                        }
                    }),
                createdAt: newOrder.created_at,
                updatedAt: newOrder.updated_at,
            }
        });
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi khi lấy toàn bộ đơn hàng: ' + error.message);
    }
}

// Lấy toàn bộ đơn hàng theo trạng thái pending_manager_approval cho role quản lý (Có phân trang)
const getAllOrdersPaginatedWithStatusPendingManagerApproval = async(queryOptions) => {
    try {
        const { page, limit, searchTerm } = queryOptions;
        const offset = (page - 1) * limit;
        const { count, rows: ordersBD } = await Order.findAndCountAll({
            where: {
                status: 'pending_manager_approval'
            },
            limit,
            offset,
            include: [
                {
                    model: ProductOrder,
                    as: 'OrderProducts'
                },
                {
                    model: User,
                    as: 'OrderCreatedByUser'
                }
            ],
            order: [[ 'created_at', 'DESC']],
            distinct: true
        });
        const totalPages = Math.ceil(count/limit);
        const orders = ordersBD.map((order) => {
            const newOrder = order.toJSON();
            return {
                id: newOrder.id,
                code: newOrder.code,
                name: newOrder.name,
                productQuantity: newOrder.product_quantity,
                process: newOrder.process,
                status: newOrder.status,
                createdBy: {
                    fullName: newOrder.OrderCreatedByUser.full_name,
                    role: newOrder.OrderCreatedByUser.role
                },
                isOrderShippingCreated: newOrder.is_order_shipping_created,
                products: (newOrder.OrderProducts ?? [])
                    .filter((el) => el.order_id === newOrder.id)
                    .map((product) => {
                        return{
                            id: product.id,
                            name: product.name,
                            skuCode: product.sku_code,
                            quantity: product.quantity,
                            description: product.description,
                            isChecked: product.is_checked,
                            createdAt: product.created_at,
                            updatedAt: product.updated_at,
                        }
                    }),
                createdAt: newOrder.created_at,
                updatedAt: newOrder.updated_at,
            }
        });
        return {
            data: orders,
            totalPages,
            currentPage: page,
            total: count
        }
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi khi lấy toàn bộ đơn hàng: ' + error.message);
    }
}

// Lấy danh sách đơn hàng cho nhân viên sản xuất: nhóm theo 3 trạng thái + tổng số lượng từng trạng thái
const getListOrdersForProductionEmployee = async(id) => {
    try {
        // 3 trạng thái dành cho nhân viên sản xuất
        const productionStatuses = ['pending_production', 'in_production', 'production_completed'];

        // Lấy tất cả đơn hàng thuộc 3 trạng thái trên
        const ordersBD = await Order.findAll({
            where: {
                status: { [Op.in]: productionStatuses },
                assigned_to: id
            },
            include: [
                {
                    model: ProductOrder,
                    as: 'OrderProducts'
                }
            ],
            order: [['created_at', 'DESC']],
            distinct: true
        });

        // Map về dạng trả ra cho FE
        const mapOrder = (order) => {
            const newOrder = order.toJSON();
            return {
                id: newOrder.id,
                code: newOrder.code,
                name: newOrder.name,
                productQuantity: newOrder.product_quantity,
                process: newOrder.process,
                status: newOrder.status,
                createdBy: newOrder.created_by,
                isOrderShippingCreated: newOrder.is_order_shipping_created,
                products: (newOrder.OrderProducts ?? [])
                    .filter((el) => el.order_id === newOrder.id)
                    .map((product) => {
                        return {
                            id: product.id,
                            name: product.name,
                            skuCode: product.sku_code,
                            quantity: product.quantity,
                            description: product.description,
                            isChecked: product.is_checked,
                            createdAt: product.created_at,
                            updatedAt: product.updated_at,
                        }
                    }),
                createdAt: newOrder.created_at,
                updatedAt: newOrder.updated_at,
            }
        };

        // Nhóm đơn hàng theo từng trạng thái (tương ứng 3 cột trên giao diện)
        const data = {
            pending_production: [],
            in_production: [],
            production_completed: []
        };
        ordersBD.forEach((order) => {
            const mapped = mapOrder(order);
            data[mapped.status].push(mapped);
        });

        // Tổng số lượng từng trạng thái (hiển thị badge trên đầu mỗi cột)
        const statusCounts = {
            pending_production: data.pending_production.length,
            in_production: data.in_production.length,
            production_completed: data.production_completed.length
        };
        const list = {
            data,
            statusCounts
        }
        return list;
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi khi lấy ra danh sách đơn hàng cho nhân viên sản xuất: ' + error.message);
    }
}

// Lấy danh sách đơn hàng sản xuất theo trạng thái đã duyệt, chờ sản xuất, đang sản xuất, đã sản xuất, bị từ chối
const getListOrdersWithStatus = async(queryOptions) => {
    try {
        const { page, limit, searchTerm, status } = queryOptions;
        const offset = (page - 1) * limit;
        const orderStatuses = ['manager_approved', 'pending_production', 'in_production', 'production_completed', 'manager_rejected'];
        const whereClause = { status: { [Op.in]: orderStatuses } };
        if(status && status !== 'all'){
            whereClause.status = status;
        }
        if(searchTerm){
            whereClause[Op.or] = [
                { code: { [Op.iLike]: `%${searchTerm}%` }},
                { name: { [Op.iLike]: `%${searchTerm}%` }}
            ]
        };
        const { count, rows: ordersBD } = await Order.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            include: [
                {
                    model: ProductOrder,
                    as: 'OrderProducts'
                },
                {
                    model: User,
                    as: 'OrderCreatedByUser'
                },
                {
                    model: User,
                    as: 'OrderApprovedByUser'
                }
            ],
            order: [[ 'created_at', 'DESC']],
            distinct: true
        });
        const totalPages = Math.ceil(count/limit);
        const orders = ordersBD.map((order) => {
            const newOrder = order.toJSON();
            return {
                id: newOrder.id,
                code: newOrder.code,
                name: newOrder.name,
                productQuantity: newOrder.product_quantity,
                process: newOrder.process,
                status: newOrder.status,
                createdBy: {
                    fullName: newOrder.OrderCreatedByUser.full_name,
                    role: newOrder.OrderCreatedByUser.role
                },
                approvedBy: {
                    fullName: newOrder.OrderApprovedByUser.full_name,
                    role: newOrder.OrderApprovedByUser.role
                },
                isOrderShippingCreated: newOrder.is_order_shipping_created,
                products: (newOrder.OrderProducts ?? [])
                    .filter((el) => el.order_id === newOrder.id)
                    .map((product) => {
                        return{
                            id: product.id,
                            name: product.name,
                            skuCode: product.sku_code,
                            quantity: product.quantity,
                            description: product.description,
                            isChecked: product.is_checked,
                            createdAt: product.created_at,
                            updatedAt: product.updated_at,
                        }
                    }),
                createdAt: newOrder.created_at,
                updatedAt: newOrder.updated_at,
            }
        });
        return {
            data: orders,
            totalPages,
            currentPage: page,
            total: count
        }
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra khi lấy danh sách: " + error.message)
    }
}

// Lấy danh sách chi tiết đơn hàng
const getDetailOrderWithProduct = async(id) => {
    try {
        const orderDB = await Order.findByPk(id, {
            include: [
                {
                    model: ProductOrder,
                    as: 'OrderProducts'
                }
            ],
            order: [['created_at', 'DESC']],
            distinct: true
        });
        if(!orderDB){
            throw new(StatusCodes.NOT_FOUND, "Không tồn tại bản ghi này");
        }
        const newOrder = orderDB.toJSON();
        const order = {
            id: newOrder.id,
            code: newOrder.code,
            name: newOrder.name,
            productQuantity: newOrder.product_quantity,
            process: newOrder.process,
            status: newOrder.status,
            createdBy: newOrder.created_by,
            isOrderShippingCreated: newOrder.is_order_shipping_created,
            products: (newOrder.OrderProducts ?? [])
                .filter((el) => el.order_id === newOrder.id)
                .map((product) => {
                    return {
                        id: product.id,
                        name: product.name,
                        skuCode: product.sku_code,
                        quantity: product.quantity,
                        description: product.description,
                        isChecked: product.is_checked,
                        createdAt: product.created_at,
                        updatedAt: product.updated_at,
                    }
            }),
            createdAt: newOrder.created_at,
            updatedAt: newOrder.updated_at,            
        }
        return order
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message )
    }
}

// Tick/untick 1 sản phẩm trong đơn.
// - Trừ/hoàn tồn kho của Product (match theo tên: ProductOrder.name === Product.name, vì ProductOrder chưa có product_id)
// - Tick mà không đủ tồn kho -> chặn, báo lỗi
// - Tính lại process (1 chữ số thập phân) + cập nhật status đơn
// - Trả về chi tiết đơn đã cập nhật, đồng thời broadcast realtime cho màn hình 3 cột
const updateProductChecked = async(productOrderId, isChecked) => {
    const transaction = await db.sequelize.transaction();
    try {
        // 1. Lấy sản phẩm trong đơn
        const productOrder = await ProductOrder.findByPk(productOrderId, { transaction });
        if(!productOrder){
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy sản phẩm trong đơn hàng');
        }

        // 2. Trạng thái không đổi -> không động vào kho (idempotent), trả về luôn
        if(productOrder.is_checked === isChecked){
            await transaction.commit();
            return await getDetailOrderWithProduct(productOrder.order_id);
        }

        // 3. Tìm sản phẩm trong kho theo mã sku + khóa dòng để tránh race khi nhiều người cùng tick
        const product = await Product.findOne({
            where: { sku_code: productOrder.sku_code },
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if(!product){
            throw new ApiError(StatusCodes.BAD_REQUEST, `Không tìm thấy sản phẩm "${productOrder.name}" trong kho`);
        }

        const qty = productOrder.quantity;
        if(isChecked){
            // Tick -> trừ kho, chặn nếu không đủ
            if(product.amount < qty){
                throw new ApiError(StatusCodes.BAD_REQUEST, `Sản phẩm "${product.name}" không đủ tồn kho (còn ${product.amount}, cần ${qty})`);
            }
            product.amount -= qty;
        }else{
            // Untick -> hoàn kho
            product.amount += qty;
        }
        product.status = product.amount <= 0 ? 'out_of_stock' : 'in_stock';
        await product.save({ transaction });

        // 4. Cập nhật trạng thái tick của sản phẩm trong đơn
        productOrder.is_checked = isChecked;
        await productOrder.save({ transaction });

        // 5. Tính lại process + status của đơn
        const orderId = productOrder.order_id;
        const productsOfOrder = await ProductOrder.findAll({ where: { order_id: orderId }, transaction });
        const total = productsOfOrder.length;
        const checkedCount = productsOfOrder.filter((p) => p.is_checked).length;
        // process = 100 / tổng số sản phẩm * số đã tick, giữ 1 chữ số thập phân
        const process = total > 0 ? Math.round((checkedCount / total) * 1000) / 10 : 0;

        const order = await Order.findByPk(orderId, { transaction });
        order.process = process;
        // 0% -> chờ sản xuất; >0% -> đang sản xuất (đạt 100% vẫn giữ in_production, "Hoàn thành" là thao tác riêng)
        order.status = process === 0 ? 'pending_production' : 'in_production';
        await order.save({ transaction });

        await transaction.commit();

        // 6. Broadcast sau khi commit để client nhận dữ liệu mới nhất
        await emitProductionOrdersUpdated(order.assigned_to);           // màn hình 3 cột (process/status)
        await productService.emitAmountProductUpdated(); // danh sách tồn kho (amount)
        await emitOrdersUpdated(); // danh sách đơn hàng

        // 7. Trả về chi tiết đơn đã cập nhật
        return await getDetailOrderWithProduct(orderId);
    } catch (error) {
        await transaction.rollback();
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message);
    }
}

// cập nhật trạng thái cho đơn khi hoàn thành
const updateStatusForOrderCompleted = async(id, status) => {
    try {
        const order = await Order.findByPk(id);
        order.status = status,
        await order.save()
        await emitProductionOrdersUpdated(order.assigned_to);           // màn hình 3 cột (process/status)
        await emitOrdersUpdated(); // danh sách đơn hàng
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message);  
    }
}

// gửi duyệt cho đơn hoàn thành
const sendApprovalForOrderCompleted = async(id, status) => {
    try {
        const order = await Order.findByPk(id);
        order.status = status,
        await order.save()
        await emitProductionOrdersUpdated(order.assigned_to);           // màn hình 3 cột (process/status)
        await emitOrdersUpdated(); // danh sách đơn hàng
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message);  
    }
}

// duyệt đơn bởi nhân viên tạo đơn
const approvedByAppEmployee = async(id, status) => {
    try {
        const order = await Order.findByPk(id);
        order.status = status,
        await order.save()        
        await emitOrdersUpdated(); // danh sách đơn hàng
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message);  
    }
}

// gửi đơn lên chờ quản lý duyệt
const sendApprovalOrderToManager = async(id, status) => {
    try {
        const order = await Order.findByPk(id);
        order.status = status,
        await order.save()        
        // await emitOrdersUpdated(); // danh sách đơn hàng
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message);  
    }
}

// duyệt đơn bởi quản lý
const approvedByManager = async(id, body) => {
    try {
        const order = await Order.findByPk(id);
        order.status = body.status,
        order.approved_by = body.approvedBy
        await order.save()        
        await emitOrdersUpdated(); // danh sách đơn hàng
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message);  
    }
}

// Xử lý phần tiếp nhận đơn
/*
    1. Tìm kiếm đơn hàng theo id đơn hàng được truyền vào
    2. Kiểm tra assigned_to
    2.1. Nếu assigned_to === null => gắn id của nhân viên sản xuất truyền vào, bắn emit
    2.2. Nếu tồn tại assigned_to => bắn thông báo
*/
const receivedOrderByProEmployee = async(orderId, payload) => {
    try {
        const orderDB = await Order.findByPk(orderId);
        if(!orderDB) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Không tồn tại bản ghi nào.")
        }
        if(orderDB.assigned_to){
            if(orderDB.assigned_to === payload.userId){
                throw new ApiError(StatusCodes.BAD_REQUEST, "Đơn hàng này đã được chính bạn tiếp nhận.")
            } else{
                const userDB = await User.findByPk(orderDB.assigned_to)
                throw new ApiError(StatusCodes.BAD_REQUEST, `Đơn hàng này đã được nhân viên ${userDB.full_name} tiếp nhận.`)                
            }
        }
        if(!orderDB.assigned_to){
            orderDB.assigned_to = payload.userId
            orderDB.status = payload.status
            await orderDB.save()
        }

        await emitProductionOrdersUpdated(orderDB.assigned_to);           // màn hình 3 cột (process/status)
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message);  
    }
}

// Xóa đơn hàng ở trạng thái chờ quản lý phê duyệt
const deleteOrder = async(id) => {
    const transaction = await db.sequelize.transaction();
    try {
        const orderDB = await Order.findByPk(id, { transaction });
        if(!orderDB){
            throw new ApiError(StatusCodes.NOT_FOUND, "Không tồn tại bản ghi.")
        }
        // Xóa các sản phẩm thuộc đơn hàng
        await ProductOrder.destroy({
            where: {
                order_id: orderDB.id
            },
            transaction
        });

        await orderDB.destroy({ transaction });
        await transaction.commit();
        
        await emitOrdersUpdated(); // danh sách đơn hàng
    } catch (error) {
        await transaction.rollback()
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message);  
    }
}

// Lấy danh sách đơn hàng giao nhận ở trạng thái pending_approval (Chờ phê duyệt)
const getListExchangeOrderWithPendingApproval = async(queryOptions) => {
    try {
        const { page, limit, searchTerm } = queryOptions;
        const offset = (page - 1) * limit;  
        const whereClause = { delivery_status:  'pending_approval' };
        if(searchTerm){
            whereClause[Op.or] = [
                { delivery_order_code: { [Op.iLike]: `%${searchTerm}%` }},
            ]
        };
        const { count, rows: exchangeOrdersBD } = await DeliveryOrder.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            include: [
                {
                    model: Order,
                    as: 'DeliveryOrderInfo',
                    include: [{ model: ProductOrder, as: 'OrderProducts' }]
                },
                {
                    model: DeliveryPerson,
                    as: 'DeliveryPerson'
                },
                {
                    model: Recipient,
                    as: 'Recipient'
                },
                {
                    model: User,
                    as: 'DeliveryCreatedByUser'
                }
            ],
            order: [[ 'created_at', 'DESC']],
            distinct: true
        })
        const totalPages = Math.ceil(count/limit);
        const exchangeOrders = exchangeOrdersBD.map((exchangeOrder) => {
            const newExchangeOrder = exchangeOrder.toJSON();
            return {
                id: newExchangeOrder.id,
                deliveryOrderCode: newExchangeOrder.delivery_order_code,
                deliveryOrderName: newExchangeOrder.delivery_order_code.split("-")[1],
                order: {
                    id: newExchangeOrder.DeliveryOrderInfo.id,
                    code: newExchangeOrder.DeliveryOrderInfo.code,
                    name: newExchangeOrder.DeliveryOrderInfo.name,
                    productQuantity: newExchangeOrder.DeliveryOrderInfo.product_quantity,
                    process: newExchangeOrder.DeliveryOrderInfo.process,
                    status: newExchangeOrder.DeliveryOrderInfo.status,
                    createdBy: newExchangeOrder.DeliveryOrderInfo.created_by,
                    isOrderShippingCreated: newExchangeOrder.DeliveryOrderInfo.is_order_shipping_created,
                    products: (newExchangeOrder.DeliveryOrderInfo.OrderProducts ?? [])
                        .filter((el) => el.order_id === newExchangeOrder.DeliveryOrderInfo.id)
                        .map((product) => {
                            return{
                                id: product.id,
                                name: product.name,
                                skuCode: product.sku_code,
                                quantity: product.quantity,
                                description: product.description,
                                isChecked: product.is_checked,
                                createdAt: product.created_at,
                                updatedAt: product.updated_at,
                            }
                        }),
                },
                deliveryPerson: {
                    id: newExchangeOrder.DeliveryPerson.id,
                    fullName: newExchangeOrder.DeliveryPerson.full_name,
                    phone: newExchangeOrder.DeliveryPerson.phone,
                    vehicleType: newExchangeOrder.DeliveryPerson.vehicle_type,
                    licensePlate: newExchangeOrder.DeliveryPerson.license_plate,
                },
                recipient: {
                    id: newExchangeOrder.Recipient.id,
                    fullName: newExchangeOrder.Recipient.full_name,
                    phone: newExchangeOrder.Recipient.phone,
                    email: newExchangeOrder.Recipient.email ?? null,
                    address: newExchangeOrder.Recipient.address
                },
                deliveryDate: newExchangeOrder.delivery_date,
                deliveryStatus: newExchangeOrder.delivery_status,
                shippingFee: newExchangeOrder.shipping_fee,
                shippingCarrier: newExchangeOrder.shipping_carrier,
                address: newExchangeOrder.address,
                createdAt: newExchangeOrder.created_at,
                updatedAt: newExchangeOrder.updated_at
            }
        });
        return {
            data: exchangeOrders,
            totalPages,
            currentPage: page,
            total: count
        }
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message)
    }
}

// Lấy danh sách đơn hàng giao nhận
const getListExchangeOrders = async(queryOptions) => {
    try {
        const { page, limit, searchTerm, status } = queryOptions;
        const offset = (page - 1) * limit;  
        const whereClause = {};
        if(status && status !== 'all'){
            whereClause.delivery_status = status;
        }
        if(searchTerm){
            whereClause[Op.or] = [
                { delivery_order_code: { [Op.iLike]: `%${searchTerm}%` }},
            ]
        };
        const { count, rows: exchangeOrdersBD } = await DeliveryOrder.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            include: [
                {
                    model: Order,
                    as: 'DeliveryOrderInfo',
                    include: [{ model: ProductOrder, as: 'OrderProducts' }]
                },
                {
                    model: DeliveryPerson,
                    as: 'DeliveryPerson'
                },
                {
                    model: Recipient,
                    as: 'Recipient'
                },
                {
                    model: User,
                    as: 'DeliveryCreatedByUser'
                }
            ],
            order: [[ 'created_at', 'DESC']],
            distinct: true
        })
        const totalPages = Math.ceil(count/limit);
        const exchangeOrders = exchangeOrdersBD.map((exchangeOrder) => {
            const newExchangeOrder = exchangeOrder.toJSON();
            return {
                id: newExchangeOrder.id,
                deliveryOrderCode: newExchangeOrder.delivery_order_code,
                deliveryOrderName: newExchangeOrder.delivery_order_code.split("-")[1],
                order: {
                    id: newExchangeOrder.DeliveryOrderInfo.id,
                    code: newExchangeOrder.DeliveryOrderInfo.code,
                    name: newExchangeOrder.DeliveryOrderInfo.name,
                    productQuantity: newExchangeOrder.DeliveryOrderInfo.product_quantity,
                    process: newExchangeOrder.DeliveryOrderInfo.process,
                    status: newExchangeOrder.DeliveryOrderInfo.status,
                    createdBy: newExchangeOrder.DeliveryOrderInfo.created_by,
                    isOrderShippingCreated: newExchangeOrder.DeliveryOrderInfo.is_order_shipping_created,
                    products: (newExchangeOrder.DeliveryOrderInfo.OrderProducts ?? [])
                        .filter((el) => el.order_id === newExchangeOrder.DeliveryOrderInfo.id)
                        .map((product) => {
                            return{
                                id: product.id,
                                name: product.name,
                                skuCode: product.sku_code,
                                quantity: product.quantity,
                                description: product.description,
                                isChecked: product.is_checked,
                                createdAt: product.created_at,
                                updatedAt: product.updated_at,
                            }
                        }),
                },
                deliveryPerson: {
                    id: newExchangeOrder.DeliveryPerson.id,
                    fullName: newExchangeOrder.DeliveryPerson.full_name,
                    phone: newExchangeOrder.DeliveryPerson.phone,
                    vehicleType: newExchangeOrder.DeliveryPerson.vehicle_type,
                    licensePlate: newExchangeOrder.DeliveryPerson.license_plate,
                },
                recipient: {
                    id: newExchangeOrder.Recipient.id,
                    fullName: newExchangeOrder.Recipient.full_name,
                    phone: newExchangeOrder.Recipient.phone,
                    email: newExchangeOrder.Recipient.email ?? null,
                    address: newExchangeOrder.Recipient.address
                },
                deliveryDate: newExchangeOrder.delivery_date,
                deliveryStatus: newExchangeOrder.delivery_status,
                shippingFee: newExchangeOrder.shipping_fee,
                shippingCarrier: newExchangeOrder.shipping_carrier,
                address: newExchangeOrder.address,
                createdAt: newExchangeOrder.created_at,
                updatedAt: newExchangeOrder.updated_at
            }
        });
        return {
            data: exchangeOrders,
            totalPages,
            currentPage: page,
            total: count
        }
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message)
    }
}

// Lấy danh sách đơn hàng giao nhận chờ tiếp nhận
const getListExchangeOrdersReceived = async(queryOptions) => {
    try {
        const { page, limit, searchTerm } = queryOptions;
        const offset = (page - 1) * limit;  
        const whereClause = { delivery_status: "manager_approved" };
        // if(status && status !== 'all'){
        //     whereClause.delivery_status = status;
        // }
        if(searchTerm){
            whereClause[Op.or] = [
                { delivery_order_code: { [Op.iLike]: `%${searchTerm}%` }},
            ]
        };
        const { count, rows: exchangeOrdersBD } = await DeliveryOrder.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            include: [
                {
                    model: Order,
                    as: 'DeliveryOrderInfo',
                    include: [{ model: ProductOrder, as: 'OrderProducts' }]
                },
                {
                    model: DeliveryPerson,
                    as: 'DeliveryPerson'
                },
                {
                    model: Recipient,
                    as: 'Recipient'
                },
                {
                    model: User,
                    as: 'DeliveryCreatedByUser'
                }
            ],
            order: [[ 'created_at', 'DESC']],
            distinct: true
        })
        const totalPages = Math.ceil(count/limit);
        const exchangeOrders = exchangeOrdersBD.map((exchangeOrder) => {
            const newExchangeOrder = exchangeOrder.toJSON();
            return {
                id: newExchangeOrder.id,
                deliveryOrderCode: newExchangeOrder.delivery_order_code,
                deliveryOrderName: newExchangeOrder.delivery_order_code.split("-")[1],
                createdBy: newExchangeOrder.created_by,
                assignedTo: newExchangeOrder.assigned_to,
                approvedBy: newExchangeOrder.approved_by,
                order: {
                    id: newExchangeOrder.DeliveryOrderInfo.id,
                    code: newExchangeOrder.DeliveryOrderInfo.code,
                    name: newExchangeOrder.DeliveryOrderInfo.name,
                    productQuantity: newExchangeOrder.DeliveryOrderInfo.product_quantity,
                    process: newExchangeOrder.DeliveryOrderInfo.process,
                    status: newExchangeOrder.DeliveryOrderInfo.status,
                    createdBy: newExchangeOrder.DeliveryOrderInfo.created_by,
                    isOrderShippingCreated: newExchangeOrder.DeliveryOrderInfo.is_order_shipping_created,
                    products: (newExchangeOrder.DeliveryOrderInfo.OrderProducts ?? [])
                        .filter((el) => el.order_id === newExchangeOrder.DeliveryOrderInfo.id)
                        .map((product) => {
                            return{
                                id: product.id,
                                name: product.name,
                                skuCode: product.sku_code,
                                quantity: product.quantity,
                                description: product.description,
                                isChecked: product.is_checked,
                                createdAt: product.created_at,
                                updatedAt: product.updated_at,
                            }
                        }),
                },
                deliveryPerson: {
                    id: newExchangeOrder.DeliveryPerson.id,
                    fullName: newExchangeOrder.DeliveryPerson.full_name,
                    phone: newExchangeOrder.DeliveryPerson.phone,
                    vehicleType: newExchangeOrder.DeliveryPerson.vehicle_type,
                    licensePlate: newExchangeOrder.DeliveryPerson.license_plate,
                },
                recipient: {
                    id: newExchangeOrder.Recipient.id,
                    fullName: newExchangeOrder.Recipient.full_name,
                    phone: newExchangeOrder.Recipient.phone,
                    email: newExchangeOrder.Recipient.email ?? null,
                    address: newExchangeOrder.Recipient.address
                },
                deliveryDate: newExchangeOrder.delivery_date,
                deliveryStatus: newExchangeOrder.delivery_status,
                shippingFee: newExchangeOrder.shipping_fee,
                shippingCarrier: newExchangeOrder.shipping_carrier,
                address: newExchangeOrder.address,
                createdAt: newExchangeOrder.created_at,
                updatedAt: newExchangeOrder.updated_at
            }
        });
        return {
            data: exchangeOrders,
            totalPages,
            currentPage: page,
            total: count
        }
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message)
    }
}

// Lấy danh sách đơn hàng giao nhận chờ lấy hàng
const getListExchangeOrdersWithAwaitingPickup= async(queryOptions) => {
    try {
        const { page, limit, searchTerm } = queryOptions;
        const offset = (page - 1) * limit;  
        const whereClause = { delivery_status: "awaiting_pickup" };
        // if(status && status !== 'all'){
        //     whereClause.delivery_status = status;
        // }
        if(searchTerm){
            whereClause[Op.or] = [
                { delivery_order_code: { [Op.iLike]: `%${searchTerm}%` }},
            ]
        };
        const { count, rows: exchangeOrdersBD } = await DeliveryOrder.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            include: [
                {
                    model: Order,
                    as: 'DeliveryOrderInfo',
                    include: [{ model: ProductOrder, as: 'OrderProducts' }]
                },
                {
                    model: DeliveryPerson,
                    as: 'DeliveryPerson'
                },
                {
                    model: Recipient,
                    as: 'Recipient'
                },
                {
                    model: User,
                    as: 'DeliveryCreatedByUser'
                }
            ],
            order: [[ 'created_at', 'DESC']],
            distinct: true
        })
        const totalPages = Math.ceil(count/limit);
        const exchangeOrders = exchangeOrdersBD.map((exchangeOrder) => {
            const newExchangeOrder = exchangeOrder.toJSON();
            return {
                id: newExchangeOrder.id,
                deliveryOrderCode: newExchangeOrder.delivery_order_code,
                deliveryOrderName: newExchangeOrder.delivery_order_code.split("-")[1],
                createdBy: newExchangeOrder.created_by,
                assignedTo: newExchangeOrder.assigned_to,
                approvedBy: newExchangeOrder.approved_by,
                order: {
                    id: newExchangeOrder.DeliveryOrderInfo.id,
                    code: newExchangeOrder.DeliveryOrderInfo.code,
                    name: newExchangeOrder.DeliveryOrderInfo.name,
                    productQuantity: newExchangeOrder.DeliveryOrderInfo.product_quantity,
                    process: newExchangeOrder.DeliveryOrderInfo.process,
                    status: newExchangeOrder.DeliveryOrderInfo.status,
                    createdBy: newExchangeOrder.DeliveryOrderInfo.created_by,
                    isOrderShippingCreated: newExchangeOrder.DeliveryOrderInfo.is_order_shipping_created,
                    products: (newExchangeOrder.DeliveryOrderInfo.OrderProducts ?? [])
                        .filter((el) => el.order_id === newExchangeOrder.DeliveryOrderInfo.id)
                        .map((product) => {
                            return{
                                id: product.id,
                                name: product.name,
                                skuCode: product.sku_code,
                                quantity: product.quantity,
                                description: product.description,
                                isChecked: product.is_checked,
                                createdAt: product.created_at,
                                updatedAt: product.updated_at,
                            }
                        }),
                },
                deliveryPerson: {
                    id: newExchangeOrder.DeliveryPerson.id,
                    fullName: newExchangeOrder.DeliveryPerson.full_name,
                    phone: newExchangeOrder.DeliveryPerson.phone,
                    vehicleType: newExchangeOrder.DeliveryPerson.vehicle_type,
                    licensePlate: newExchangeOrder.DeliveryPerson.license_plate,
                },
                recipient: {
                    id: newExchangeOrder.Recipient.id,
                    fullName: newExchangeOrder.Recipient.full_name,
                    phone: newExchangeOrder.Recipient.phone,
                    email: newExchangeOrder.Recipient.email ?? null,
                    address: newExchangeOrder.Recipient.address
                },
                deliveryDate: newExchangeOrder.delivery_date,
                deliveryStatus: newExchangeOrder.delivery_status,
                shippingFee: newExchangeOrder.shipping_fee,
                shippingCarrier: newExchangeOrder.shipping_carrier,
                address: newExchangeOrder.address,
                createdAt: newExchangeOrder.created_at,
                updatedAt: newExchangeOrder.updated_at
            }
        });
        return {
            data: exchangeOrders,
            totalPages,
            currentPage: page,
            total: count
        }
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message)
    }
}

// duyệt đơn gioa nhận bởi quản lý
const approvedExchangeOrderByManager = async(id, body) => {
    try {
        const exchangeOrder = await DeliveryOrder.findByPk(id);
        exchangeOrder.delivery_status = body.status,
        exchangeOrder.approved_by = body.approvedBy
        await exchangeOrder.save()        
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message);  
    }
}

// tiếp nhận đơn hàng bởi nhân viên giao
const receivedOrderByExchangeEmployee = async(orderId, payload) => {
    try {
        const orderDB = await DeliveryOrder.findByPk(orderId);
        if(!orderDB) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Không tồn tại bản ghi nào.")
        }
        if(orderDB.assigned_to){
            if(orderDB.assigned_to === payload.userId){
                throw new ApiError(StatusCodes.BAD_REQUEST, "Đơn hàng này đã được chính bạn tiếp nhận.")
            } else{
                const userDB = await User.findByPk(orderDB.assigned_to)
                throw new ApiError(StatusCodes.BAD_REQUEST, `Đơn hàng này đã được nhân viên ${userDB.full_name} tiếp nhận.`)                
            }
        }
        if(!orderDB.assigned_to){
            orderDB.assigned_to = payload.userId
            orderDB.delivery_status = payload.status
            await orderDB.save()
        }

    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message);  
    }
}


/**
 * Cập nhật trạng thái giao hàng theo từng bước khi NV tick vòng tròn.
 * Luồng 4 bước trên UI:
 *   1. Tạo đơn giao hàng          (đã có sẵn khi tạo đơn: pending_approval/manager_approved/awaiting_pickup)
 *   2. Tài xế đến lấy hàng         -> picked_up
 *   3. Tài xế trên đường giao hàng -> out_for_delivery
 *   4. Theo nút bấm:
 *        - Thành công -> delivered       (Tài xế giao hoàn thành)
 *        - Thất bại   -> delivery_failed  (Tài xế giao thất bại)
 *
 * @param {string} deliveryOrderId - id đơn giao hàng (DeliveryOrder)
 * @param {('success'|'failed')} [result] - chỉ cần ở bước 4 (theo nút Thành công/Thất bại)
 */
const DELIVERY_FINAL_STATUSES = ['delivered', 'delivery_failed', 'cancelled', 'rejected', 'manager_rejected'];

const updateDeliveryStatusByStep = async (deliveryOrderId, result) => {
    const transaction = await db.sequelize.transaction();
    try {
        const deliveryOrder = await DeliveryOrder.findByPk(deliveryOrderId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!deliveryOrder) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Không tồn tại đơn giao hàng.');
        }

        const current = deliveryOrder.delivery_status;

        // Đơn đã kết thúc thì không cho cập nhật thêm
        if (DELIVERY_FINAL_STATUSES.includes(current)) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Đơn giao hàng đã kết thúc, không thể cập nhật thêm.'
            );
        }

        // Xác định trạng thái kế tiếp theo bước hiện tại
        let next;
        switch (current) {
            // Bước 1 -> Bước 2
            case 'pending_approval':
            case 'manager_approved':
            case 'awaiting_pickup':
                next = 'picked_up'; // Tài xế đến lấy hàng
                break;
            // Bước 2 -> Bước 3
            case 'picked_up':
                next = 'out_for_delivery'; // Tài xế trên đường giao hàng
                break;
            // Bước 3 -> Bước 4 (theo nút bấm)
            case 'out_for_delivery':
                if (result === 'success') {
                    next = 'delivered'; // Tài xế giao hoàn thành
                } else if (result === 'failed') {
                    next = 'delivery_failed'; // Tài xế giao thất bại
                } else {
                    throw new ApiError(
                        StatusCodes.BAD_REQUEST,
                        "Bước cuối cần chọn kết quả 'success' (Thành công) hoặc 'failed' (Thất bại)."
                    );
                }
                break;
            default:
                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    'Trạng thái hiện tại không hợp lệ để cập nhật.'
                );
        }

        deliveryOrder.delivery_status = next;
        // Ghi nhận thời điểm giao thành công
        if (next === 'delivered') {
            deliveryOrder.actual_delivery_date = new Date();
        }
        await deliveryOrder.save({ transaction });
        await transaction.commit();

        return deliveryOrder;
    } catch (error) {
        await transaction.rollback();
        if (error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message);
    }
};

module.exports = {
    getNewOrderCode,
    createOrderWithProduct,
    getListOrderWithProduct,
    getListOrdersForProductionEmployee,
    emitProductionOrdersUpdated,
    getDetailOrderWithProduct,
    updateProductChecked,
    updateStatusForOrderCompleted,
    sendApprovalForOrderCompleted,
    getAllOrders,
    approvedByAppEmployee,
    sendApprovalOrderToManager,
    getAllOrdersWithStatusPendingManagerApproval,
    getAllOrdersPaginatedWithStatusPendingManagerApproval,
    approvedByManager,
    updateOrderWithProduct,
    createOrderShipping,
    getListReceivedOrder,
    receivedOrderByProEmployee,
    deleteOrder,
    getListExchangeOrderWithPendingApproval,
    getListExchangeOrders,
    getListOrdersWithStatus,
    approvedExchangeOrderByManager,
    getListExchangeOrdersReceived,
    receivedOrderByExchangeEmployee,
    getListExchangeOrdersWithAwaitingPickup,
    updateDeliveryStatusByStep
}
