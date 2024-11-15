// routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const healthController = require('../../controllers/healthControllers');

// GET /api/health/products - Retrieve all health products
router.get('/public/products', healthController.getAllHealthProducts);

// Define a route that takes a bloodGroupIndex parameter
router.get(
  '/public/:height/:desiredWeight/:age/:bloodGroupIndex/:currentWeight',
  healthController.getCategoriesForBloodGroup
);

router.get('/public/products/:name', healthController.getSearchedProduct);

module.exports = router;
