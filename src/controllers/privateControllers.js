const { getCategoriesForBloodGroup, addConsumedProduct, deleteConsumedProduct, getConsumedInfoForDate } = require('../services/privateServices');
const { extractUserId } = require('../middlewares/extractUserId');

exports.getPrivateCategoriesForBloodGroup = async (req, res, next) => {
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
    const authHeader = req.headers.authorization;
    // console.log(authHeader);

    if (!authHeader) {
      // Dacă antetul "Authorization" lipsește, returnați o eroare de autentificare
      return res
        .status(401)
        .json({ status: 'error', message: 'Missing Authorization header' });
    }

    const userId = extractUserId(authHeader);

    // Validate the index
    if (isNaN(bloodGroupIndex) || bloodGroupIndex < 1) {
      return res.status(400).json({ error: 'Invalid blood group index' });
    }

    const user = await getCategoriesForBloodGroup(
      userId,
      recommendedDailyCaloriesIntake,
      height,
      desiredWeight,
      age,
      bloodGroupIndex,
      currentWeight
    );
    res.status(200).json({
      status: 'success',
      recommendedDailyCaloriesIntake: Math.round(
        recommendedDailyCaloriesIntake
      ),
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.addConsumedProduct = async (req, res, next) => {
  try {
    const { product, date, quantity } = req.body;

    // Validate input
    if (!product || !date || !quantity || quantity <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid input. Please provide product, date, and a valid quantity.'
      });
    }

    // Get the user ID from the request (assuming JWT authentication)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing Authorization header'
      });
    }

    const userId = extractUserId(authHeader); // Assuming this utility extracts user ID from token

    // Call the service to add the consumed product
    const updatedUser = await addConsumedProduct(userId, product, date, quantity);

    return res.status(200).json({
      status: 'success',
      message: updatedUser.message,
      data: updatedUser.user
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteConsumedProductForUser = async (req, res) => {
  const { productId, date } = req.params;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing Authorization header'
      });
    }

    const userId = extractUserId(authHeader); // Assuming this utility extracts user ID from token

    const response = await deleteConsumedProduct(userId, productId, date);

    return res.status(200).json({
      success: true,
      message: response.message,
      consumedProducts: response.consumedProducts,
      user: response.user
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    if (error.message === 'Product not found or not consumed on that date') {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not consumed on that date',
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while deleting the product',
    });
  }
};

exports.getConsumedInfoForSpecificDay = async (req, res) => {
  const { date } = req.params;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing Authorization header'
      });
    }

    const userId = extractUserId(authHeader); // Assuming this utility extracts user ID from token

    const result = await getConsumedInfoForDate(userId, date);

    return res.status(200).json({
      success: true,
      dailyCalorieIntake: result.dailyCalorieIntake,
      totalCaloriesConsumed: result.totalCaloriesConsumed,
      remainingCalories: result.remainingCalories,
      percentageCaloriesConsumed: result.percentageCaloriesConsumed,
      consumedProducts: result.consumedProducts,
    });
  } catch (error) {
    if (error.message === 'No consumed products found for this date') {
      return res.status(404).json({
        success: false,
        message: 'No consumed products found for the given date',
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while fetching consumed product data',
    });
  }
};


