const express = require("express");
const {
  getAllCourses,
  createCourse,
  editCourse,
  deleteCourse,
  exportCourses,
  importCourses,
  getCoursebyId,
} = require("../controllers/courseController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/", protect, getAllCourses); //displays all courses with instructor details and total enrolled students
router.post("/", protect, createCourse); //create a new course
router.put("/:id", protect, editCourse); //edit a course
router.delete("/:id", protect, deleteCourse); //delete a course
router.get("/export", protect, exportCourses); //export all courses
router.post("/import", protect, importCourses); //import courses
router.get("/:id", protect, getCoursebyId); //export all courses
module.exports = router;
