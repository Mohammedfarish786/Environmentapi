const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
  getAllInstructors,
  updateInstructor,
  deleteInstructor,
  importInstructor,
  exportInstructor,
  approveInstructor,
  getInstructorById,
} = require("../controllers/instructorController");

const { registerTeacher } = require("../controllers/authController");

// Import / Export first (avoid route conflict)
router.post("/import", protect, importInstructor);
router.get("/export", protect, exportInstructor);
router.put("/approve", protect, approveInstructor);

// CRUD
router.get("/", protect, getAllInstructors);
router.post("/", protect, registerTeacher);
router.put("/:user_id", protect, updateInstructor);
router.delete("/:user_id", protect, deleteInstructor);

router.get("/:user_id", protect, getInstructorById);

module.exports = router;
