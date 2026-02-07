const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

// AWS Configuration
const region = process.env.AWS_REGION || "ap-south-2";
const bucketName = process.env.AWS_S3_BUCKET;

// Initialize S3 Client
console.log({
  region: region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const s3 = new S3Client({
  region: region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Debug: Check if bucket name is loaded
console.log("AWS Config loaded:");
console.log("Bucket Name:", bucketName);
console.log("Region:", region);

if (!bucketName) {
  console.error("❌ ERROR: AWS_S3_BUCKET environment variable is not set!");
  console.error("Please add AWS_S3_BUCKET=your-bucket-name to your .env file");
}

module.exports = {
  s3,
  bucketName,
  region,
};
