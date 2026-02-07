const express = require("express");
const {
  getAllStudent,
  updateStudent,
  deleteStudent,
  approveStudent,
  importStudent,
  exportStudent,
  getStudentById
} = require("../controllers/studentController");
const { registerStudent } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();
router.get("/",protect, getAllStudent);
router.post("/", protect, registerStudent);
router.put("/:id", protect, updateStudent);
router.delete("/:id", protect, deleteStudent);
router.put("/approvestatus/:id", protect, approveStudent);
router.get("/export", protect, exportStudent);
router.post("/import", protect, importStudent);
router.get("/:id", protect, getStudentById);
module.exports = router;
