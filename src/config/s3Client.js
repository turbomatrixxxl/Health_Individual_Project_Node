const AWS = require("aws-sdk");
require("dotenv").config();

// Set up the S3 client to interact with Cloudflare R2
const s3Client = new AWS.S3({
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: process.env.R2_REGION,
  endpoint: process.env.R2_ENDPOINTS, // Ensure this matches your Cloudflare R2 endpoint
  signatureVersion: "v4",
  s3BucketEndpoint: true,
  httpOptions: {
    headers: {
      Authorization: `Bearer ${process.env.R2_TOKEN}`, // Adding the R2_TOKEN from .env
    },
  },
});

module.exports = { s3Client };
