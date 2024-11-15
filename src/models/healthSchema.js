const mongoose = require('mongoose');

const healthSchema = new mongoose.Schema({
  categories: String,
  weight: Number,
  title: String,
  calories: Number,
  groupBloodNotAllowed: [Boolean],
});

module.exports = mongoose.model('health', healthSchema);
