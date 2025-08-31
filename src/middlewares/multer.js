// cloudinary multer
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Set up Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatars', // Folder in Cloudinary to store the images
    allowed_formats: ['jpg', 'png', 'jpeg'], // Allowed formats
    transformation: [{ width: 32, height: 32, crop: 'fill' }], // Resize and crop
    resource_type: 'image', // Ensures Cloudinary treats it as an image
  },
});

// File filter to ensure only images are uploaded
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

// Initialize multer with Cloudinary storage and file filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
