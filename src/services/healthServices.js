/* eslint-disable no-unused-vars */
// services/healthServices.js
const Health = require('../models/healthSchema');

const getAllHealthProducts = async () => {
  try {
    const products = await Health.find({});
    return products;
  } catch (error) {
    throw new Error('Error fetching products from Health collection');
  }
};

const getCategoriesForBloodGroup = async (bloodGroupIndex) => {
  try {
    // Find all categories where groupBloodNotAllowed[bloodGroupIndex] is false
    const result = await Health.find({
      [`groupBloodNotAllowed.${bloodGroupIndex}`]: false,
    });
    return result;
  } catch (error) {
    throw new Error('Error fetching categories for the specified blood group');
  }
};

const getCategoryByName = async (name) => {
  try {
    const aliment = await Health.find({ name });

    if (!aliment) {
      throw new Error('This aliment category does not exist!');
    }

    return aliment;
  } catch (error) {
    throw new Error('Error fetching category by name', error.message);
  }
};

module.exports = {
  getAllHealthProducts,
  getCategoriesForBloodGroup,
  getCategoryByName,
};
