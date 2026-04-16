const express = require("express");
const aiController = require("../controllers/ai.controller");

const router = express.Router();

router.post("/analyze", aiController.analyzeTeam);

module.exports = router;
