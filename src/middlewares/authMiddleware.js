/* eslint-disable no-undef */
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const token = authHeader.split(' ')[1];
  //   console.log(token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);

    const user = await User.findById(decoded.id);
    // console.log(user.token === token);

    if (!user || user.token !== token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: 'Not authorized', error: error.message });
  }
};

module.exports = { authMiddleware };
