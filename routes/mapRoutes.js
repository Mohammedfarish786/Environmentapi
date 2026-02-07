const express = require("express");
const {
  saveProgress,
  retrieveProgress,
} = require("../controllers/mapController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();
router.get("/:user_id", protect, retrieveProgress);
router.post("/:user_id", protect, saveProgress);
module.exports = router;
