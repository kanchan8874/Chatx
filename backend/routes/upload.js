import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { getUserFromRequest } from "../lib/auth.js";
import { connectDB } from "../lib/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images, PDFs, and common document types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
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
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // Determine file type
    const imageTypes = /jpeg|jpg|png|gif|webp/;
    const fileType = imageTypes.test(path.extname(req.file.filename).toLowerCase())
      ? "image"
      : "document";

    // Return file URL (in production, use cloud storage URL)
    const fileUrl = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get("host")}${fileUrl}`;

    res.json({
      url: fullUrl,
      filename: req.file.originalname,
      fileType,
      fileSize: req.file.size,
    });
  } catch (error) {
    console.error("File upload error:", error);
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
      }
    }
    res.status(500).json({ error: "Failed to upload file." });
  }
});

export default router;

