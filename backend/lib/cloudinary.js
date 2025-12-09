import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend folder first, then try root folder
dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

// Validate Cloudinary credentials
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn(" Cloudinary credentials not found in .env file!");
  console.warn("   Please add the following to your .env file:");
  console.warn("   CLOUDINARY_CLOUD_NAME=your_cloud_name");
  console.warn("   CLOUDINARY_API_KEY=your_api_key");
  console.warn("   CLOUDINARY_API_SECRET=your_api_secret");
} else {
  console.log(" Cloudinary credentials loaded");
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
export async function uploadToCloudinary(fileBuffer, originalName, mimeType) {
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary credentials not configured. Please check your .env file.");
  }

  return new Promise((resolve, reject) => {
    // Determine resource type and folder
    const isImage = mimeType.startsWith("image/");
    const resourceType = isImage ? "image" : "raw";
    const folder = isImage ? "chatx/images" : "chatx/files";

    // Upload options
    const uploadOptions = {
      folder,
      resource_type: resourceType,
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      overwrite: false,
      invalidate: true,
    };

 
    if (isImage) {
      uploadOptions.quality = "auto"; // Auto quality optimization
      
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error(" Cloudinary upload error:", error);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          console.log("File uploaded to Cloudinary:", {
            public_id: result.public_id,
            url: result.secure_url,
            size: result.bytes,
          });
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type (image or raw)
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFromCloudinary(publicId, resourceType = "image") {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log(" File deleted from Cloudinary:", publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
}

export default cloudinary;

