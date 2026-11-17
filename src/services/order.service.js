const { StatusCodes } = require('http-status-codes');
const { Order, ProductOrder, Product } = require('../models');
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
            code, name, product_quantity: productQuantity, created_by: createdBy
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

        // Sau khi tạo đơn thành công -> đẩy lại danh sách mới cho màn hình nhân viên sản xuất (realtime)
        await emitProductionOrdersUpdated();
    } catch (error) {
        await transaction.rollback();
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra: ' + error.message)
    }
}

// Lấy dữ liệu mới nhất và broadcast tới tất cả client để cập nhật data + statusCounts realtime
const emitProductionOrdersUpdated = async() => {
    try {
        const list = await getListOrdersForProductionEmployee();
        broadcast('production_orders:updated', list);
    } catch (error) {
        // Không để lỗi broadcast làm hỏng luồng chính (đơn đã được tạo thành công)
        console.error('Lỗi khi broadcast production_orders:updated: ' + error.message);
    }
}

// Lấy dữ liệu mới nhất và broadcast tới tất cả client để cập nhật data + statusCounts realtime
const emitOrdersUpdated = async() => {
    try {
        const data = await getListOrderWithProduct({ page: 1, limit: 1000 });
        broadcast('orders:updated', data);
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
                products: (newOrder.OrderProducts ?? [])
                    .filter((el) => el.order_id === newOrder.id)
                    .map((product) => {
                        return{
                            id: product.id,
                            name: product.name,
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
                status: 'approved'
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
                products: (newOrder.OrderProducts ?? [])
                    .filter((el) => el.order_id === newOrder.id)
                    .map((product) => {
                        return{
                            id: product.id,
                            name: product.name,
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
                products: (newOrder.OrderProducts ?? [])
                    .filter((el) => el.order_id === newOrder.id)
                    .map((product) => {
                        return{
                            id: product.id,
                            name: product.name,
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
                createdBy: newOrder.created_by,
                products: (newOrder.OrderProducts ?? [])
                    .filter((el) => el.order_id === newOrder.id)
                    .map((product) => {
                        return{
                            id: product.id,
                            name: product.name,
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
const getListOrdersForProductionEmployee = async() => {
    try {
        // 3 trạng thái dành cho nhân viên sản xuất
        const productionStatuses = ['pending_production', 'in_production', 'production_completed'];

        // Lấy tất cả đơn hàng thuộc 3 trạng thái trên
        const ordersBD = await Order.findAll({
            where: {
                status: { [Op.in]: productionStatuses }
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
                products: (newOrder.OrderProducts ?? [])
                    .filter((el) => el.order_id === newOrder.id)
                    .map((product) => {
                        return {
                            id: product.id,
                            name: product.name,
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
            products: (newOrder.OrderProducts ?? [])
                .filter((el) => el.order_id === newOrder.id)
                .map((product) => {
                    return {
                        id: product.id,
                        name: product.name,
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
        await emitProductionOrdersUpdated();           // màn hình 3 cột (process/status)
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
        await emitProductionOrdersUpdated();           // màn hình 3 cột (process/status)
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
        await emitProductionOrdersUpdated();           // màn hình 3 cột (process/status)
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
const approvedByManager = async(id, status) => {
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
    approvedByManager
}
