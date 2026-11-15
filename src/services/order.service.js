const { StatusCodes } = require('http-status-codes');
const { Order, ProductOrder } = require('../models');
const ApiError = require('../utils/ApiError');
const { Op, QueryTypes } = require('sequelize');
const db = require('../models');
const { broadcast } = require('../config/websocket');

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

module.exports = {
    getNewOrderCode,
    createOrderWithProduct,
    getListOrderWithProduct,
    getListOrdersForProductionEmployee,
    emitProductionOrdersUpdated
}
