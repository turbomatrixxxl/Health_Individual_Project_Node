const {
  registerUser,
  getUserById,
  loginUser,
  logoutUser,
  verifyUserEmail,
  resendVerificationEmail,
} = require('../services/authServices');

const { validateUser } = require('../middlewares/validationMiddleware');

const { extractUserId } = require('../middlewares/extractUserId');

const Joi = require('joi');

exports.register = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    const newUser = await registerUser(username, email, password);
    // console.log(newUser);

    res.status(201).json({
      user: {
        username: newUser.username,
        email: newUser.email,
        height: newUser.height,
        desiredWeight: newUser.desiredWeight,
        age: newUser.age,
        bloodType: newUser.bloodType,
        weight: newUser.weight,
        avatarURL: newUser.avatarURL,
        verify: newUser.verify,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message });
    next(error);
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validate request body
  const { error } = validateUser.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const { user, token } = await loginUser(email, password);

    // Respond with the user data and token (null if unverified)
    res.status(200).json({
      token: token, // Null if user is not verified
      user: user,
    });
  } catch (error) {
    // Handle login errors (e.g., invalid credentials)
    res.status(401).json({ message: error.message });
  }
};



exports.logout = async (req, res, next) => {
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

    // Continuați cu logica dvs. pentru a găsi utilizatorul și a trimite răspunsul
    const result = await logoutUser(userId);

    if (result) {
      res.status(204).json({ message: 'Logged out', data: result });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
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

    // Continuați cu logica dvs. pentru a găsi utilizatorul și a trimite răspunsul
    const result = await getUserById(userId);
    // console.log(result);
    if (result) {
      res.status(200).json({
        status: 'success',
        code: 200,
        data: {
          id: result._id,
          name: result.username,
          email: result.email,
          avatarURL: result.avatarURL,
          token: result.token,
          verify: result.verify,
          dietaryInfo: result.dietaryInfo,
          height: result.height,
          age: result.age,
          bloodType: result.bloodType,
          desiredWeight: result.desiredWeight,
          weight: result.weight,
        },
      });
    } else {
      // Returnați o eroare 404 sau 401 în funcție de situație
      res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: 'error', message: 'Server error' });
    next(error);
  }
};

exports.verifyUserEmail = async (req, res) => {
  const { verificationToken } = req.params;

  try {
    await verifyUserEmail(verificationToken);

    res.status(200).json({ message: 'User successfully verified', code: 200 });
  } catch (error) {
    res
      .status(404)
      .json({ message: 'Error verifying user', error: error.message });
  }
};

exports.handleResendVerificationEmail = async (req, res) => {
  const emailSchema = Joi.object({
    email: Joi.string().email().required(),
  });

  // Validate request body
  const { error } = emailSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: 'Email wrong written' });
  }

  console.log(req.body);

  const { email } = req.body;
  // console.log(email);

  if (!email) {
    return res.status(400).json({ message: 'Missing required field email' });
  }

  try {
    const response = await resendVerificationEmail(email);
    return res.status(200).json(response);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(400).json({ message: 'User not found' });
    }
    if (error.message === 'Verification has already been passed') {
      return res
        .status(400)
        .json({ message: 'Verification has already been passed' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};
