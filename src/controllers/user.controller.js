const { StatusCodes } = require('http-status-codes');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const userService = require('../services/user.service');

// Tạo tài khoản
const createAccountUser = catchAsync(async(req, res) => {
    const user = await userService.createdAccount(req.body);
    res.status(StatusCodes.CREATED).send({ success: true, message: 'Tạo tài khoản cho nhân sự thành công.', data: user })
})

// Lấy ra danh sách + search tài khoản
const getListAccounts = catchAsync(async (req, res) => {
    const queryOptions = pick(req.query, ['page', 'limit', 'role', 'searchTerm']);
    const accounts = await userService.queryListAccounts(queryOptions);
    res.status(StatusCodes.OK).send({ success: true, message: 'Lấy danh sách thành công.', data: accounts})
})

module.exports = {
    createAccountUser,
    getListAccounts
}