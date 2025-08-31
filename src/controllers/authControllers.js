const {
  registerUser,
  getUserById,
  loginUser,
  logoutUser,
  verifyUserEmail,
  resendVerificationEmail,
  updateUser,
} = require('../services/authServices');

const { validateUser } = require('../middlewares/validationMiddleware');

const { extractUserId } = require('../middlewares/extractUserId');

// const path = require('path');

const bcrypt = require('bcryptjs');

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
    });
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

    res.setHeader('Content-Type', 'text/html');
    console.log(
      'Redirecting to:',
      'https://turbomatrixxxl.github.io/Health_Individual_Project_React/'
    );

    return res.redirect(
      302,
      'https://turbomatrixxxl.github.io/Health_Individual_Project_React/'
    );
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

exports.updateUserInfo = async (req, res, next) => {
  const { username, email, password } = req.body;

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

    // Hash the password if a new password is provided
    const updateFields = { username, email };

    if (password) {
      const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
      updateFields.password = hashedPassword;
    }

    // Call the service to update user information
    const updatedUser = await updateUser(userId, updateFields);

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // If the update is successful, return the updated user data
    res.status(200).json({
      status: 'success',
      code: 200,
      data: { user: updatedUser },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
    next(error);
  }
};

exports.updateUseravatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(404).json({ error: 'There is no file to upload!' });
    }

    // Log file details to verify it's being received correctly
    console.log('Received file:', req.file);

    // Use the Cloudinary URL directly from Multer
    const cloudinaryUrl = req.file.path; // Multer will provide the secure URL

    // Update fields with Cloudinary URL
    const updateFields = { avatarURL: cloudinaryUrl };

    // Update user in the database
    const updatedUser = await updateUser(req.user._id, updateFields, {
      new: true,
    });

    // Send success response
    res.status(200).json({
      avatarUrl: updatedUser.avatarURL,
    });
  } catch (error) {
    console.error('Error in uploading avatar:', error.message);
    res.status(500).json({
      status: 'fail',
      code: 500,
      message: error.message,
      data: 'Internal Server Error',
    });
  }
};
