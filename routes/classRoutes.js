const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
  createClass,
  getAllClasses,
  updateClass,
  deleteClass,
  importClass,
  exportClass,
} = require("../controllers/classController");

// Order matters
router.post("/import", protect, importClass);
router.get("/export", protect, exportClass);

router.post("/", protect, createClass);
router.get("/", protect, getAllClasses);
router.put("/:id", protect, updateClass);
router.delete("/:id", protect, deleteClass);

module.exports = router;
