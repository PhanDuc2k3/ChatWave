const express = require("express");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.post("/read-all", notificationController.markAllAsRead);

module.exports = router;
