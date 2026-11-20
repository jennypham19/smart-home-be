const { StatusCodes } = require('http-status-codes');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const userService = require('../services/user.service');

// Tạo tài khoản
const createAccountUser = catchAsync(async(req, res) => {
    const user = await userService.createdAccount(req.body);
    res.status(StatusCodes.CREATED).send({ success: true, message: 'Tạo tài khoản cho nhân sự thành công.', data: user })
})

// Chỉnh sửa thông tin
const updateAccountUser = catchAsync(async(req, res) => {
    await userService.updateAccount(req.params.id, req.body);
    res.status(StatusCodes.OK).send({ success: true, message: 'Cập nhật thông tin nhân sự thành công.'})
})

// Lấy ra danh sách + search tài khoản
const getListAccounts = catchAsync(async (req, res) => {
    const queryOptions = pick(req.query, ['page', 'limit', 'role', 'searchTerm']);
    const accounts = await userService.queryListAccounts(queryOptions);
    res.status(StatusCodes.OK).send({ success: true, message: 'Lấy danh sách thành công.', data: accounts})
})

// Reset mật khẩu tài khoản
const resetPasswordAccount = catchAsync(async (req, res) => {
    const newPassword = await userService.resetPasswordAccount(req.params.id);
    res.status(StatusCodes.OK).send({ success: true, message: "Đặt lại mật khẩu thành công", data: { newPassword } })
})

// Thay đổi mật khẩu tài khoản
const changePasswordAccount = catchAsync(async (req, res) => {
    await userService.changePassword(req.params.id, req.body.password);
    res.status(StatusCodes.OK).send({ success: true, message: "Thay đổi mật khẩu thành công" })
})

module.exports = {
    createAccountUser,
    getListAccounts,
    updateAccountUser,
    resetPasswordAccount,
    changePasswordAccount
}