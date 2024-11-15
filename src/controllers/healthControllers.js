// controllers/healthControllers.js
const healthService = require('../services/healthServices');

const getAllHealthProducts = async (req, res, next) => {
  try {
    const products = await healthService.getAllHealthProducts();
    res.status(200).json({
      status: 'success',
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred',
    });
    next(error);
  }
};

const getCategoriesForBloodGroup = async (req, res, next) => {
  const { height, desiredWeight, age, bloodGroupIndex, currentWeight } =
    req.params;

  let recommendedDailyCaloriesIntake =
    10 * desiredWeight + 6.25 * height - 5 * age;

  if (desiredWeight === currentWeight) {
    return res.status(200).json({
      status: 'success',
      recommendedDailyCaloriesIntake: recommendedDailyCaloriesIntake,
      data: [],
    });
  }

  if (desiredWeight > currentWeight) {
    recommendedDailyCaloriesIntake += 500;
  } else if (desiredWeight < currentWeight) {
    recommendedDailyCaloriesIntake -= 500;
  }

  try {
    // Validate the index
    if (isNaN(bloodGroupIndex) || bloodGroupIndex < 1) {
      return res.status(400).json({ error: 'Invalid blood group index' });
    }

    const categories =
      await healthService.getCategoriesForBloodGroup(bloodGroupIndex);
    res.status(200).json({
      status: 'success',
      recommendedDailyCaloriesIntake: Math.round(
        recommendedDailyCaloriesIntake
      ),
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

const getSearchedProduct = async (req, res, next) => {
  const { name } = req.params;

  // Validate that `name` is a non-empty string
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Invalid name' });
  }

  try {
    const product = await healthService.getCategoryByName(name);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllHealthProducts,
  getCategoriesForBloodGroup,
  getSearchedProduct,
};
