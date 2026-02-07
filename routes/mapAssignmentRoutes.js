const express = require("express");
const {
  retrieveProgress,
  mapAssignment,
} = require("../controllers/mapAssignmentController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();
router.get("/:assigned_by", protect, retrieveProgress);
router.post("/", protect, mapAssignment);
module.exports = router;
