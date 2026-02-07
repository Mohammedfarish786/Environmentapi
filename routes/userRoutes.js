const express = require("express");
const {
  getAllUsers,
  getUsersByRole,
  getUserById,
  getUserProfileById,
  createUser,
  updateUser,
  updateTeacherProfile,
  updateStudentProfile,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Get all users (no filtering)
router.get("/all", protect, getAllUsers);

// Get users by roleId (using path parameter)
router.get("/role/:roleId", protect, getUsersByRole);

// Get user by ID
router.get("/:id", protect, getUserById);

// Get user profile by ID
router.get("/profile/:id", protect, getUserProfileById);

// Create user
router.post("/", protect, createUser);

// Update user basic information
router.put("/:id", protect, updateUser);

// Update teacher profile
router.put("/teacher/profile/:user_id", protect, updateTeacherProfile);

// Update student profile
router.put("/student/profile/:user_id", protect, updateStudentProfile);

module.exports = router;
