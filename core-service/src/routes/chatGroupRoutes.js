const express = require("express");
const chatGroupController = require("../controllers/chatGroupController");

const router = express.Router();

router.post("/", chatGroupController.createGroup);
router.get("/", chatGroupController.getMyGroups);
router.get("/:id", chatGroupController.getGroupById);
router.post("/:id/members", chatGroupController.addMember);
router.patch("/:id/members/:memberId", chatGroupController.updateMemberRole);
router.delete("/:id/members/:memberId", chatGroupController.removeMember);
router.post("/:id/leave", chatGroupController.leaveGroup);
router.delete("/:id", chatGroupController.deleteGroup);
router.post("/:id/transfer-leadership", chatGroupController.transferLeadership);
router.patch("/:id/avatar", chatGroupController.updateAvatar);

module.exports = router;
