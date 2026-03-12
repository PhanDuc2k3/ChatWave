const express = require("express");
const chatGroupController = require("../controllers/chatGroupController");

const router = express.Router();

router.post("/", chatGroupController.createGroup);
router.get("/", chatGroupController.getMyGroups);
router.get("/:id", chatGroupController.getGroupById);
router.post("/:id/members", chatGroupController.addMember);
router.delete("/:id/members/:memberId", chatGroupController.removeMember);
router.post("/:id/leave", chatGroupController.leaveGroup);

module.exports = router;
