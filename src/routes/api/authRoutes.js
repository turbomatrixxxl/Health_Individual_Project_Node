const express = require('express');
const authController = require('../../controllers/authControllers');
const { authMiddleware } = require('../../middlewares/authMiddleware');

const upload = require('../../middlewares/multer');

const router = express.Router();

router.post('/users/signup', authController.register);
router.post('/users/login', authController.login);

router.get('/users/verify/:verificationToken', authController.verifyUserEmail);

// POST /users/verify - Resend verification email
router.post('/users/verify', authController.handleResendVerificationEmail);

router.post('/users/logout', authMiddleware, authController.logout);

router.get('/users/current', authMiddleware, authController.getCurrentUser);

router.patch('/users/update', authMiddleware, authController.updateUserInfo);

// Route to handle avatar upload
router.patch(
  '/users/avatar',
  authMiddleware,
  (req, res, next) => {
    console.log('Upload started');
    req.uploadStart = Date.now(); // Store start time in the req object
    next();
  },
  upload.single('avatar'), // Multer handles the file upload
  (err, req, res, next) => {
    if (err) {
      // Multer error or any error during the upload
      return res.status(400).json({
        status: 'fail',
        message: err.message || 'File upload error',
      });
    }
    next(); // Proceed to the next middleware if no error
  },
  authController.updateUseravatar // Delegate to the controller for further processing
);

module.exports = router;
