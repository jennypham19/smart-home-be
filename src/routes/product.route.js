// src/routes/product.route.js
const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const productController = require('../controllers/product.controller');
const productValidation = require('../validations/production.validation');
const baseValidation = require('../validations/base.validation');
const validate = require('../middlewares/validate');

const router = express.Router();

router.post('/product-created', validate(productValidation.createProduct), productController.createProduct)

router.get('/list-products', validate(baseValidation.queryOptions), productController.getListProducts)

router.get('/all-list-products', productController.handleGetAllProducts)

router.delete('/product-deleted/:id', validate(baseValidation.queryOption), productController.handleDeleteProduct)

router.put('/product-updated/:id', validate(productValidation.updateProduct), productController.handleUpdateProduct)

module.exports = router;