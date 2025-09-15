const Health = require('../models/healthSchema');
const User = require('../models/userSchema');
const moment = require('moment');

exports.getCategoriesForBloodGroup = async (
  userId,
  recommendedDailyCaloriesIntake,
  height,
  desiredWeight,
  age,
  bloodGroupIndex,
  weight
) => {
  if (age < 0 || height < 0 || desiredWeight < 0 || weight < 0) {
    return;
  }
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
          'dietaryInfo.dailyCalorieIntake': Math.round(
            recommendedDailyCaloriesIntake
          ),
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
    const productToAdd = await Health.findOne({ title: product });

    if (!productToAdd) {
      throw new Error('Eroor finding product !');
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
            productName: productToAdd.title,
            date,
            quantity,
            calories: totalCalories,
          },
        },
      },
      { new: true }
    );

    return {
      message: isForbidden
        ? 'This product is not recommended for your blood type.'
        : 'This product is recommended for your blood type.',
      user: user,
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
      (product) =>
        product.product.toString() === productId &&
        product.date.toISOString().split('T')[0] === date
    );

    if (productIndex === -1) {
      throw new Error('Product not found or not consumed on that date');
    }

    // Remove the product from the array
    user.consumedProducts.splice(productIndex, 1);

    // Save the updated user document
    await user.save();

    return {
      success: true,
      message: 'Product successfully deleted',
      user: user,
      consumedProducts: user.consumedProducts,
    };
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

    // if (consumedProducts.length === 0) {
    //   throw new Error('No consumed products found for this date');
    // }

    // Calculate total calories consumed
    const totalCaloriesConsumed = consumedProducts.reduce(
      (sum, product) => sum + product.calories,
      0
    );

    // Calculate remaining calories
    const remainingCalories =
      Math.round(user.dietaryInfo.dailyCalorieIntake) - totalCaloriesConsumed;

    // Calculate percentage of calories consumed
    const percentageCaloriesConsumed = Math.round(
      (totalCaloriesConsumed /
        Math.round(user.dietaryInfo.dailyCalorieIntake)) *
        100
    );

    // Function to find product name by ID
    const findProductById = async (id) => {
      const product = await Health.findById(id);

      return product ? product.title : 'Unknown Product'; // Return product title or a default if not found
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
    throw new Error(
      error.message ||
        'Failed to fetch consumed products for the specified date'
    );
  }
};

exports.setStepsDailyRegistrations = async (userId, totalSteps) => {
  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySteps = user.steps.find((step) => {
      const stepsDate = new Date(step.date);
      stepsDate.setHours(0, 0, 0, 0);
      return today.getTime() === stepsDate.getTime();
    });

    if (!todaySteps) {
      user.steps.push({ quantity: totalSteps, date: new Date() });
    } else {
      todaySteps.quantity = totalSteps;
    }

    await user.save();

    return user;
  } catch (error) {
    throw new Error(error.message || 'Failed to set Steps for today !');
  }
};

exports.setSleepDailyRegistrations = async (userId, hours) => {
  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySleep = user.sleep.find((sl) => {
      const sleepDate = new Date(sl.date);
      sleepDate.setHours(0, 0, 0, 0);
      return today.getTime() === sleepDate.getTime();
    });

    if (!todaySleep) {
      user.sleep.push({ quantity: hours, date: new Date() });
    } else {
      todaySleep.quantity = hours;
    }

    await user.save();

    return user;
  } catch (error) {
    throw new Error(error.message || 'Failed to set Sleep hours for today !');
  }
};

exports.setHeartDailyRegistrations = async (
  userId,
  systolic,
  diastolic,
  pulse
) => {
  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayHeart = user.heart.find((sl) => {
      const heartDate = new Date(sl.date);
      heartDate.setHours(0, 0, 0, 0);
      return today.getTime() === heartDate.getTime();
    });

    if (!todayHeart) {
      user.heart.push({
        systolic: systolic,
        diastolic: diastolic,
        pulse: pulse,
        date: new Date(),
      });
    } else {
      todayHeart.systolic = systolic;
      todayHeart.diastolic = diastolic;
      todayHeart.pulse = pulse;
    }

    await user.save();

    return user;
  } catch (error) {
    throw new Error(error.message || 'Failed to set Heart Metrix for today !');
  }
};

exports.addEditReminder = async (
  userId,
  id,
  text,
  time,
  frequency,
  repeat,
  end,
  type,
  active,
  done,
  doneDates = [] // default array dacă nu vine nimic din frontend
) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const today = moment().local().format('YYYY-MM-DD.mm');

    if (!id) {
      // Reminder nou
      user.reminders.push({
        text,
        time,
        frequency,
        repeat,
        end,
        type,
        active,
        done,
        doneDates: done ? [today] : doneDates, // ✅ folosim ce vine sau îl inițializăm
      });
    } else {
      // Reminder existent
      const reminder = user.reminders.find((rem) => rem._id.toString() === id);
      if (!reminder) throw new Error('Failed to find Reminder !');

      reminder.text = text;
      reminder.time = time;
      reminder.frequency = frequency;
      reminder.repeat = repeat;
      reminder.end = end;
      reminder.type = type;
      reminder.active = active;

      // ✅ adaugăm întotdeauna array-ul actualizat (din frontend sau inițializat)
      reminder.doneDates = doneDates;

      // Update done logic
      if (done) {
        if (!reminder.doneDates.includes(today)) {
          reminder.doneDates.push(today);
        }
        reminder.done = true;
      } else {
        reminder.done = false;
      }
    }

    await user.save();
    return user;
  } catch (error) {
    throw new Error(error.message || 'Failed to add/edit reminder !');
  }
};

exports.refreshDoneReminders = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const now = moment();
    const todayStr = now.format('YYYY-MM-DD');
    const todayDay2 = now.format('dd'); // "Mo", "Tu", etc
    const currentWeek = now.week();
    const currentMonth = now.month() + 1;

    user.reminders.forEach((reminder) => {
      const freq = reminder.frequency;
      const repeatHours =
        reminder.repeat && reminder.repeat !== 'noRepeat'
          ? parseInt(reminder.repeat)
          : 0;

      reminder.doneDates = reminder.doneDates || [];
      const lastDone = reminder.doneDates.length
        ? moment(reminder.doneDates[reminder.doneDates.length - 1])
        : null;

      const shouldReset = () => {
        if (!lastDone) return true;
        if (repeatHours > 0) return now.diff(lastDone, 'hours') >= repeatHours;
        return false;
      };

      // DAILY
      if (freq === 'daily') {
        if (
          repeatHours > 0
            ? shouldReset()
            : !lastDone || lastDone.format('YYYY-MM-DD') !== todayStr
        ) {
          reminder.done = false;
        }
      }

      // WEEKLY
      else if (Array.isArray(freq) && freq.includes(todayDay2)) {
        if (
          repeatHours > 0
            ? shouldReset()
            : !lastDone || lastDone.week() !== currentWeek
        ) {
          reminder.done = false;
        }
      }

      // MONTHLY
      else if (typeof freq === 'string' && freq.includes('monthly')) {
        const dayOfMonth = parseInt(freq, 10);
        if (now.date() === dayOfMonth) {
          if (
            repeatHours > 0
              ? shouldReset()
              : !lastDone || lastDone.month() + 1 !== currentMonth
          ) {
            reminder.done = false;
          }
        }
      }

      // FIXED DATE
      else if (
        /^\d{4}-\d{2}-\d{2}$/.test(freq) &&
        now.format('YYYY-MM-DD') === freq
      ) {
        if (
          repeatHours > 0
            ? shouldReset()
            : !lastDone || lastDone.format('YYYY-MM-DD') !== freq
        ) {
          reminder.done = false;
        }
      }
    });

    await user.save();
    return user;
  } catch (error) {
    throw new Error(error.message || 'Failed to refresh reminders!');
  }
};

exports.deleteReminder = async (userId, id) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.reminders = user.reminders.filter((rem) => rem._id.toString() !== id);

    await user.save();
    return user;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete reminder !');
  }
};
