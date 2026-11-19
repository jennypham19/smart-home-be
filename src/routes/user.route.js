// src/routes/user.route.js
const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const userController = require('../controllers/user.controller');
const userValidation = require('../validations/user.validation');
const baseValidation = require('../validations/base.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect, authorize('admin'));

// tạo
router.post('/user-account-created', validate(userValidation.createAccount), userController.createAccountUser)

router.put(
    '/user-account-updated/:id',
    validate(userValidation.updateAccount),
    userController.updateAccountUser
)
// lấy danh sách
router.get(
    '/get-list-accounts',
    validate(userValidation.getQuery),
    userController.getListAccounts
)

module.exports = router