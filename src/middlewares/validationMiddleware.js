const Joi = require('joi');

const validateUser = Joi.object({
  // username: Joi.string()
  //   .pattern(/^[a-zA-Z\s]+$/) // Acceptă doar litere și spații
  //   .min(3) // Lungimea minimă de 3 caractere
  //   .max(30) // Lungimea maximă de 30 de caractere
  //   .required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(6)
    .pattern(
      new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&.])[A-Za-z\\d@$!%*?&.]{6,}$'
      )
    )
    .required(),
});

module.exports = { validateUser };
