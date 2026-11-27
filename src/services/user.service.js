const { StatusCodes } = require('http-status-codes');
const bcrypt  = require('bcryptjs');
const crypto = require('crypto');
const { User, Order, DeliveryOrder } = require('../models');
const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');

// Lấy chi tiết user theo id
const getUserById = async(id) => {
    const user = await User.findByPk(id);
    if(!user){
       throw new ApiError(StatusCodes.NOT_FOUND, `Không tồn tại bản ghi người dùng có tên là ${user.full_name}`); 
    }
    return user
}

// Kiểm tra xem có tồn tại account không
const isAccountTaken = async (account) => {
    const user = await User.findOne({ where: { account }});
    return !!user;
}

// Kiểm tra xem có tồn tại số điện thoại không
const isPhoneTaken = async (phone) => {
    const user = await User.findOne({ where: { phone }});
    return !!user
}

// Tạo tài khoản
const createdAccount = async(userBody) => {
    const { avatarUrl, fullName, phone, account, password, email, receivedJobDate, role, address } = userBody;
    try {
        // Kiểm tra tài khoản
        if(await isAccountTaken(account)){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Tài khoản đã tồn tại');
        }

        // Kiểm tra số điện thoại
        if(phone !== null && await isPhoneTaken(phone)){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Số điện thoại đã tồn tại');
        }

        // Hash mật khẩu bằng bcrypt 
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert thông tin để tạo bản ghi
        const user = await User.create({
            account,
            password: hashedPassword,
            full_name: fullName,
            role,
            email,
            phone,
            address,
            received_job_date: receivedJobDate,
            avatar_url: avatarUrl
        });
        user.password = undefined;
        return user;
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message)
    }
}

// Chỉnh sửa thông tin tài khoản
const updateAccount = async(id, userBody) => {
    try {
        const { avatarUrl, fullName, phone, email, role, address } = userBody;
        const accountDB = await User.findByPk(id);
        await accountDB.update({
            avatar_url: avatarUrl,
            full_name: fullName,
            phone,
            email,
            role,
            address
        })
        await emitAccountUpdate();
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message)
    }
}

// Xóa tài khoản, cập nhật lại is_deleted
/*
    - TH cho xóa đơn hàng: khi tạo bị sai và tài khoản chưa dính dáng gì đến đơn hàng
    - TH đã dính dáng đến đơn hàng => chuyển sang vô hiệu hóa + lý do + bàn giao công việc
*/
const deleteAccount = async(id) => {
    try {
        const accountDB = await User.findByPk(id);
        // 1. TH1: Xóa nhân viên tạo đơn (sale)
        const prodOrderCreatedByUserDB = await Order.findAll({
            where: { created_by: accountDB.id }
        })
        const exchangeOrderCreatedByUserDB = await DeliveryOrder.findAll({
            where: { created_by: accountDB.id }
        })
        if((prodOrderCreatedByUserDB.length > 0 && exchangeOrderCreatedByUserDB.length > 0) || prodOrderCreatedByUserDB.length > 0 || exchangeOrderCreatedByUserDB.length > 0){
            throw new ApiError(StatusCodes.BAD_REQUEST, `Không thể xóa nhân viên ${accountDB.full_name} bởi nhân viên này liên quan đến đơn hàng.`)
        }

        // 2. TH2: Xóa quản lý
        const prodOrderApprovedByUserDB = await Order.findAll({
            where: { approved_by: accountDB.id }
        })
        const exchangeOrderApprovedByUserDB = await DeliveryOrder.findAll({
            where: { approved_by: accountDB.id }
        })
        if((prodOrderApprovedByUserDB.length > 0 && exchangeOrderApprovedByUserDB.length > 0) || prodOrderApprovedByUserDB.length > 0 || exchangeOrderApprovedByUserDB.length > 0){
            throw new ApiError(StatusCodes.BAD_REQUEST, `Không thể xóa nhân viên ${accountDB.full_name} bởi nhân viên này liên quan đến đơn hàng.`)
        }

        // 3. TH3: Xóa nhân viên sản xuất
        const proOrderAssignedToUserDB = await Order.findAll({
            where: { assigned_to: accountDB.id }
        })
        if(proOrderAssignedToUserDB.length > 0){
            throw new ApiError(StatusCodes.BAD_REQUEST, `Không thể xóa nhân viên ${accountDB.full_name} bởi nhân viên này liên quan đến đơn hàng.`)
        }
        // 4. TH4: Xóa nhân viên đóng gói
        const exchangeOrderAssignedToUserDB = await DeliveryOrder.findAll({
            where: { assigned_to: accountDB.id }
        })
        if(exchangeOrderAssignedToUserDB.length > 0){
            throw new ApiError(StatusCodes.BAD_REQUEST, `Không thể xóa nhân viên ${accountDB.full_name} bởi nhân viên này liên quan đến đơn hàng.`)
        }

        accountDB.is_deleted = -1;
        await accountDB.save();
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message)
    }
}

// Reset mật khẩu
const resetPasswordAccount = async(id) => {
    try {
        const userDB = await User.findByPk(id);
        if(!userDB){
            throw new ApiError(StatusCodes.NOT_FOUND, "Không tồn tại bản ghi nào cả.")
        }
        // Tự sinh password ngẫu nhiên dài 6 ký tự
        const plainPassword = crypto.randomBytes(6).toString('base64').slice(0,6);

        // Hash bằng bcrypt
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        await userDB.update({ password: hashedPassword});
        userDB.password = undefined; // Không trả về password
        const newUser = userDB.toJSON();
        const userReturn = {
            ...newUser,
            fullName: newUser.full_name,
            password: plainPassword
        }
        return userReturn;
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message)
    }
}


// thay đổi mật khẩu
const changePassword = async(id, password) => {
    try {
        const userDB = await User.findByPk(id);
        if(!userDB){
            throw new ApiError(StatusCodes.NOT_FOUND, "Không tồn tại bản ghi nào cả.")
        }
        // Hash bằng bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);
        await userDB.update({ password: hashedPassword});
        userDB.password = undefined; // Không trả về password
        return userDB.toJSON();
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message)
    }
}
const emitAccountUpdate = async() => {
    try {
        const list = await queryListAccounts({ page: 1, limit: 1000 });
        broadcast('accounts:updated', list);
    } catch (error) {
        // Không để lỗi broadcast làm hỏng luồng chính (đơn đã được tạo thành công)
        console.error('Lỗi khi broadcast accounts:updated: ' + error.message);
    }
}

// Lấy ra danh sách thông tin nhân sự + search tài khoản
const queryListAccounts = async(queryOptions) => {
    try {
        const { page, limit, searchTerm, role } = queryOptions;
        const offset = (page - 1) * limit;
        const whereClause = { is_deleted: 1};
        if(role && role !== 'all'){
            whereClause.role = role;
        }
        if(searchTerm){
            whereClause[Op.or] = [
                { full_name: { [Op.iLike]: `%${searchTerm}%` }},
                { account: { [Op.iLike]: `%${searchTerm}%` }}
            ]
        };

        const { count, rows: accountsDB } = await User.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [[ 'created_at', 'DESC']]
        })
        const totalPages = Math.ceil(count/limit);
        const accounts = accountsDB.map((account) => {
            const newAccount = account.toJSON();
            return {
                id: newAccount.id,
                email: newAccount.email,
                account: newAccount.account,
                fullName: newAccount.full_name,
                role: newAccount.role,
                phone: newAccount.phone,
                address: newAccount.address,
                avatarUrl: newAccount.avatar_url,
                receivedJobDate: newAccount.received_job_date,
                status: newAccount.status,
                isDeleted: newAccount.is_deleted,
                createdAt: newAccount.created_at,
                updatedAt: newAccount.updated_at,
            }
        })
        return {
            data: accounts,
            totalPages,
            currentPage: page,
            total: count
        }
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi khi lấy ra danh sách: ' + error.message);
    }
}

module.exports = {
    createdAccount,
    queryListAccounts,
    updateAccount,
    deleteAccount,
    resetPasswordAccount,
    changePassword
}