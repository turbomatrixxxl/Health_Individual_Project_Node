const Health = require('../models/healthSchema');
const User = require('../models/userSchema');

exports.getCategoriesForBloodGroup = async (
  userId,
  recommendedDailyCaloriesIntake,
  height,
  desiredWeight,
  age,
  bloodGroupIndex,
  weight
) => {
  try {
    // Find all categories where groupBloodNotAllowed[bloodGroupIndex] is false
    const result = await Health.find({
      [`groupBloodNotAllowed.${bloodGroupIndex}`]: false,
    });
    // console.log([...result]);

    const restrictedAlimentsData = result.map((product) => ({
      categories: product.categories,
      title: product.title,
      calories: product.calories,
      weight: product.weight,
    }));

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'dietaryInfo.restrictedAliments': restrictedAlimentsData,
          'dietaryInfo.dailyCalorieIntake': Math.round(recommendedDailyCaloriesIntake),
          height: height,
          desiredWeight: desiredWeight,
          age: age,
          bloodType: bloodGroupIndex,
          weight: weight,
        },
      },
      { new: true }
    );

    return user;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    throw new Error('Error fetching categories for the specified blood group');
  }
};

exports.addConsumedProduct = async (userId, product, date, quantity) => {
  try {
    const productToAdd = await Health.findOne({ title: product })

    if (!productToAdd) {
      throw new Error('Eroor finding product !')
    }

    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      throw new Error('User not found!');
    }

    // Calculate calories based on quantity and product calories per 100 grams
    const caloriesPerGram = productToAdd.calories / 100;
    const totalCalories = Math.round(caloriesPerGram * quantity);

    // Check if the product is in the restricted aliments list
    const isForbidden = userToUpdate.dietaryInfo.restrictedAliments.some(
      (restrictedProduct) => restrictedProduct.title === product
    );

    // Update the user's consumed products with calculated calories and quantity
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          consumedProducts: {
            product: productToAdd._id,
            date,
            quantity,
            calories: totalCalories
          }
        }
      },
      { new: true }
    );

    return {
      message: isForbidden
        ? 'This product is not recommended for your blood type.'
        : 'This product is recommended for your blood type.',
      user: user
    };
  } catch (error) {
    throw new Error(`Error adding consumed product: ${error.message}`);
  }
};

exports.deleteConsumedProduct = async (userId, productId, date) => {
  try {
    // Find the user and update the consumedProducts array
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Find the product in the consumedProducts array for the specified date
    const productIndex = user.consumedProducts.findIndex(
      (product) => product.product.toString() === productId && product.date.toISOString().split('T')[0] === date
    );

    if (productIndex === -1) {
      throw new Error('Product not found or not consumed on that date');
    }

    // Remove the product from the array
    user.consumedProducts.splice(productIndex, 1);

    // Save the updated user document
    await user.save();

    return { success: true, message: 'Product successfully deleted' };
  } catch (error) {
    throw new Error(error.message || 'Failed to delete consumed product');
  }
};

exports.getConsumedInfoForDate = async (userId, date) => {
  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Convert the date to start and end of the day
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find consumed products for the specified date
    const consumedProducts = user.consumedProducts.filter((product) => {
      const productDate = new Date(product.date);
      return productDate >= startOfDay && productDate <= endOfDay;
    });

    if (consumedProducts.length === 0) {
      throw new Error('No consumed products found for this date');
    }

    // Calculate total calories consumed
    const totalCaloriesConsumed = consumedProducts.reduce((sum, product) => sum + product.calories, 0);

    // Calculate remaining calories
    const remainingCalories = Math.round(user.dietaryInfo.dailyCalorieIntake) - totalCaloriesConsumed;

    // Calculate percentage of calories consumed
    const percentageCaloriesConsumed = Math.round((totalCaloriesConsumed / Math.round(user.dietaryInfo.dailyCalorieIntake)) * 100);

    // Function to find product name by ID
    const findProductById = async (id) => {
      const product = await Health.findById(id);

      return product ? product.title : 'Unknown Product';  // Return product title or a default if not found
    };

    // Use Promise.all to resolve all product name promises
    const consumedProductsWithNames = await Promise.all(
      consumedProducts.map(async (product) => {
        const productName = await findProductById(product.product);

        return {
          product: productName,
          quantity: product.quantity,
          calories: product.calories,
        };
      })
    );

    return {
      dailyCalorieIntake: Math.round(user.dietaryInfo.dailyCalorieIntake),
      totalCaloriesConsumed: totalCaloriesConsumed,
      remainingCalories: remainingCalories,
      percentageCaloriesConsumed: percentageCaloriesConsumed,
      consumedProducts: consumedProductsWithNames,
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch consumed products for the specified date');
  }
};
