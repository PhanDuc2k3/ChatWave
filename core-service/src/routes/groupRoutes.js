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

// GET /api/v1/groups/:id/join-requests
router.get("/:id/join-requests", groupController.getPendingJoinRequests);

// GET /api/v1/groups/:id/my-join-request (requires auth)
router.get("/:id/my-join-request", groupController.getMyJoinRequest);

// POST /api/v1/groups/:id/join-requests/:requestId/approve
router.post("/:id/join-requests/:requestId/approve", groupController.approveJoinRequest);

// POST /api/v1/groups/:id/join-requests/:requestId/reject
router.post("/:id/join-requests/:requestId/reject", groupController.rejectJoinRequest);

// PATCH /api/v1/groups/:id/visibility
router.patch("/:id/visibility", groupController.updateVisibility);

// POST /api/v1/groups/:id/members
router.post("/:id/members", groupController.addMember);

// PATCH /api/v1/groups/:id/members/:memberId
router.patch("/:id/members/:memberId", groupController.updateMemberRole);

// POST /api/v1/groups/:id/transfer-leadership
router.post("/:id/transfer-leadership", groupController.transferLeadership);

// DELETE /api/v1/groups/:id/members/:memberId
router.delete("/:id/members/:memberId", groupController.removeMember);

// DELETE /api/v1/groups/:id (only leader can delete)
router.delete("/:id", groupController.deleteGroup);

module.exports = router;

