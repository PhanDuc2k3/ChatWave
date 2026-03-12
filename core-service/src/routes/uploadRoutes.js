const express = require("express");
const uploadController = require("../controllers/uploadController");

const router = express.Router();

router.post(
  "/image",
  (req, res, next) => {
    uploadController.uploadMiddleware(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || "File không hợp lệ" });
      }
      next();
    });
  },
  uploadController.uploadImage
);

module.exports = router;
