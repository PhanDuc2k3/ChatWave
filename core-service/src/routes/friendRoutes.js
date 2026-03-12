const express = require("express");
const friendController = require("../controllers/friendController");

const router = express.Router();

// GET /api/v1/friends?userId=...
router.get("/", friendController.getFriends);

// GET /api/v1/friends/requests?userId=...
router.get("/requests", friendController.getRequests);

// GET /api/v1/friends/suggestions?userId=...
router.get("/suggestions", friendController.getSuggestions);

// POST /api/v1/friends/requests
router.post("/requests", friendController.sendRequest);

// POST /api/v1/friends/requests/:id/respond
router.post("/requests/:id/respond", friendController.respondRequest);

// DELETE /api/v1/friends
router.delete("/", friendController.removeFriend);

// POST /api/v1/friends/block
router.post("/block", friendController.blockUser);

// POST /api/v1/friends/unblock
router.post("/unblock", friendController.unblockUser);

module.exports = router;

