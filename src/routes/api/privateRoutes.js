const express = require('express');
const privateController = require('../../controllers/privateControllers');
const { authMiddleware } = require('../../middlewares/authMiddleware');

const router = express.Router();

router.get(
  '/private/:height/:desiredWeight/:age/:bloodGroupIndex/:currentWeight',
  authMiddleware,
  privateController.getPrivateCategoriesForBloodGroup
);

// POST /api/private/consumed - Add a consumed product for a day
router.post("/private/consumed", authMiddleware, privateController.addConsumedProduct);

// Define the route for deleting a consumed product for a specific user
router.delete('/private/consumed/:productId/:date', authMiddleware, privateController.deleteConsumedProductForUser);

// Define the route for getting consumed products' information for a specific day
router.get('/private/:date', authMiddleware, privateController.getConsumedInfoForSpecificDay);


module.exports = router;
