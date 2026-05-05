const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname) ||
      (file.mimetype && file.mimetype.startsWith("image/"));
    if (allowed) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh (jpg, png, gif, webp)"));
    }
  },
});

async function uploadImage(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "Chưa chọn file ảnh" });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary credentials missing:", { cloudName, apiKey, hasSecret: !!apiSecret });
      return res.status(500).json({ 
        message: "Cloudinary chưa được cấu hình. Vui lòng liên hệ admin." 
      });
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "chatwave",
          resource_type: "image",
        },
        (err, result) => {
          if (err) {
            console.error("Cloudinary upload error:", err);
            reject(err);
            return;
          }
          resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    })
      .then((result) => {
        res.json({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || "Tải ảnh lên thất bại",
          error: process.env.NODE_ENV === "development" ? err.toString() : undefined
        });
      });
  } catch (err) {
    console.error("Upload image error:", err);
    next(err);
  }
}

module.exports = {
  uploadMiddleware: upload.single("file"),
  uploadImage,
};
