import { Router } from "express";
import multer from "multer";
import path from "path";
import { getUserFromRequest } from "../lib/auth.js";
import { connectDB } from "../lib/db.js";
import { uploadToCloudinary } from "../lib/cloudinary.js";

// Configure multer to use memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow images, PDFs, and common document types
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images, PDFs, and documents are allowed."));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter,
});

const router = Router();

router.use(async (req, res, next) => {
  await connectDB();
  next();
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // Check if this is an avatar upload (image file)
    // Avatar uploads during registration don't require authentication
    const isAvatarUpload = req.file.mimetype.startsWith("image/");
    
    // For non-image files (documents), require authentication
    // For image files (avatars), authentication is optional (for registration)
    if (!isAvatarUpload) {
      const user = await getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized. Please log in to upload documents." });
      }
    }
    
    // Log upload attempt (with or without auth)
    const user = await getUserFromRequest(req);
    console.log(" Uploading file to Cloudinary:", {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      isAvatarUpload,
      authenticated: !!user,
      userId: user?.id || "anonymous (registration)",
    });

    console.log(" Uploading file to Cloudinary:", {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Determine file type for response (matching Message schema enum)
    const isImage = req.file.mimetype.startsWith("image/");
    const fileType = isImage ? "image" : "document";

    console.log(" File uploaded successfully:", {
      url: cloudinaryResult.url,
      publicId: cloudinaryResult.public_id,
    });

    res.json({
      url: cloudinaryResult.url,
      fileName: req.file.originalname, // Frontend will use this
      filename: req.file.originalname, // Backend schema expects this
      fileType: fileType, // "image" or "document" (matching schema enum)
      fileSize: cloudinaryResult.bytes || req.file.size,
      publicId: cloudinaryResult.public_id, // Store for potential deletion
    });
  } catch (error) {
    console.error(" File upload error:", error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
      }
      return res.status(400).json({ error: error.message });
    }
    
    // Check if it's a Cloudinary error
    if (error.message && error.message.includes("Cloudinary")) {
      return res.status(500).json({ 
        error: "Failed to upload file to cloud storage. Please try again." 
      });
    }
    
    res.status(500).json({ error: "Failed to upload file." });
  }
});

export default router;

