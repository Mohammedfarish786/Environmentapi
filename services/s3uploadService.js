const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3, bucketName, region } = require("../config/aws");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
async function uploadBase64Image(base64Data) {
  try {
    // Remove base64 header if present
    const buffer = Buffer.from(
      base64Data.replace(/^data:image\/\w+;base64,/, ""),
      "base64",
    );

    const fileKey = `avatars/${uuidv4()}.png`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: "image/png",
      // ❗ No ACL needed if bucket is public or CloudFront is used
    });

    await s3.send(command);

    // Public URL
    const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;

    return imageUrl;
  } catch (error) {
    console.error("❌ S3 Upload Error:", error);
    throw new Error("Avatar upload failed");
  }
}
async function uploadBase64File(base64Data, folder = "course_contents") {
  try {
    // Extract mime type from base64 header
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);

    if (!matches) {
      throw new Error("Invalid base64 format");
    }

    const mimeType = matches[1];
    const fileBuffer = Buffer.from(matches[2], "base64");
    const fileSize = fileBuffer.byteLength;
    console.log("File Size:", fileSize, "bytes");
    // Decide file extension from mime type
    let extension = "";
    if (mimeType === "application/pdf") extension = "pdf";
    else if (mimeType === "application/vnd.ms-powerpoint") extension = "ppt";
    else if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )
      extension = "pptx";
    else if (mimeType.startsWith("video/")) extension = "mp4";
    else if (mimeType.startsWith("image/")) extension = "png";
    else extension = "bin";

    const fileKey = `${folder}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3.send(command);

    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;

    return fileUrl;
  } catch (error) {
    console.error("❌ S3 Upload Error:", error);
    throw new Error("File upload failed");
  }
}

async function uploadBlobFile(file, folder = "uploads") {
  try {
    if (!file) throw new Error("File not provided");

    const extension = path.extname(file.name);
    const fileKey = `${folder}/${uuidv4()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: file.data, // 👈 Buffer (Blob)
      ContentType: file.mimetype,
    });

    await s3.send(command);

    return `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
  } catch (error) {
    console.error("❌ S3 Upload Error:", error);
    throw new Error("File upload failed");
  }
}

module.exports = { uploadBase64Image, uploadBase64File };
