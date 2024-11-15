const jwt = require('jsonwebtoken');

require('dotenv').config;

// eslint-disable-next-line no-undef
const secret = process.env.JWT_SECRET;

exports.extractUserId = (authHeader) => {
  // Extrageți token-ul eliminând prefixul "Bearer "
  const token = authHeader.split(' ')[1];
  // console.log(token);

  // Verificați token-ul utilizând cheia secretă
  const user = jwt.verify(token, secret);
  // console.log(user);

  return user.id;
};
