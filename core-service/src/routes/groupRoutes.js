const express = require("express");
const groupController = require("../controllers/groupController");

const router = express.Router();

// POST /api/v1/groups
router.post("/", groupController.createGroup);

// GET /api/v1/groups?userId=...
router.get("/", groupController.getMyGroups);

// GET /api/v1/groups/discover?userId=...
router.get("/discover", groupController.getDiscoverableGroups);

// GET /api/v1/groups/search?q=...
router.get("/search", groupController.searchGroups);

// GET /api/v1/groups/:id
router.get("/:id", groupController.getGroupById);

// PATCH /api/v1/groups/:id/visibility
router.patch("/:id/visibility", groupController.updateVisibility);

// POST /api/v1/groups/:id/members
router.post("/:id/members", groupController.addMember);

// PATCH /api/v1/groups/:id/members/:memberId
router.patch("/:id/members/:memberId", groupController.updateMemberRole);

// DELETE /api/v1/groups/:id/members/:memberId
router.delete("/:id/members/:memberId", groupController.removeMember);

module.exports = router;

