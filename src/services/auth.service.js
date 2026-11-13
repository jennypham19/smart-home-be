const { User, Token, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const { StatusCodes } = require('http-status-codes');
const ApiError = require('../utils/ApiError');

// Đăng nhập
const loginWithEmailAndPassword = async (account, password) => {
    try {
        const normalizedEmail = account.toLowerCase();
        const userDB = await User.findOne({ 
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('account')),
                normalizedEmail
            )
        });
        if(!userDB || !(await bcrypt.compare(password, userDB.password))) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Tên đăng nhập hoặc mật khẩu không chính xác');
        }
        if(!userDB.status) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên');
        }
        const userRoleDB = await User.findOne({
            where: { id: userDB.id },
        })
        const user = {
            id: userRoleDB.id,
            account: userRoleDB.account,
            fullName: userRoleDB.full_name,
            role: userRoleDB.role,
            email: userRoleDB.email,
            phone: userRoleDB.phone,
            address: userRoleDB.address,
            status: userRoleDB.status,
            receivedJobDate: userRoleDB.received_job_date,
            isDeleted: userRoleDB.is_deleted,
            createdAt: userRoleDB.created_at,
            updatedAt: userRoleDB.updatedAt
        }
        return user;
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Server error during login process. ' + error.message);
    }
}

// Đăng xuất
const logout = async (refreshToken) => {
    const refreshTokenDoc = await Token.findOne({ where: { token: refreshToken, type: 'refresh'}});
    if(!refreshTokenDoc) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Refresh token không tồn tại');
    }

    await refreshTokenDoc.destroy();
}

// Lấy thông tin cá nhân
const getCurrentMe = async(id) => {
    try {
        const userDB = await User.findByPk(id, { attributes: { exclude: ['password'] }});
        if(!userDB) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Người dùng không tồn tại');
        }
        const newUser = userDB.toJSON();
        const user = {
            id: newUser.id,
            account: newUser.account,
            fullName: newUser.full_name,
            role: newUser.role,
            email: newUser.email,
            phone: newUser.phone,
            address: newUser.address,
            status: newUser.status,
            receivedJobDate: newUser.received_job_date,
            isDeleted: newUser.is_deleted,
            createdAt: newUser.created_at,
            updatedAt: newUser.updatedAt
        }
        return user;
    } catch (error) {
        if(error instanceof ApiError) throw error;
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Đã có lỗi xảy ra: " + error.message)
    }
}

module.exports = {
    loginWithEmailAndPassword,
    logout,
    getCurrentMe
}