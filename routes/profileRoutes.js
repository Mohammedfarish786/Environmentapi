const router = require("express").Router();
const {
  getEmployeeProfile,
  updateEmployeeProfile,
  getIndividualProfile,
  updateIndividualProfile,
  getStudentProfile,
  updateStudentProfile,
  getTeacherProfile,
  updateTeacherProfile,
  getInstituteAdminProfile,
  updateInstituteAdminProfile,
  getSuperAdminProfile,
  updateSuperAdminProfile,
  getInstituteProfile,
  updateInstituteProfile,
} = require("../controllers/profileController");
const { protect } = require("../middlewares/authMiddleware");

// 🔒 All profile routes require login

// Institute
router.get("/instituteprofile/:id", protect, getInstituteProfile);
router.put("/instituteprofile/:id", protect, updateInstituteProfile);

// Teacher
router.get("/teacherprofile/:id", protect, getTeacherProfile);
router.put("/teacherprofile/:id", protect, updateTeacherProfile);

// Individual
router.get("/individualprofile/:id", protect, getIndividualProfile);
router.put("/individualprofile/:id", protect, updateIndividualProfile);

// Student
router.get("/studentprofile/:id", protect, getStudentProfile);
router.put("/studentprofile/:id", protect, updateStudentProfile);
//employee
router.get("/employeeprofile/:id", protect, getEmployeeProfile);
router.put("/employeeprofile/:id", protect, updateEmployeeProfile);

//superadmin
router.get("/superadminprofile/:id", protect, getSuperAdminProfile);
router.put("/superadminprofile/:id", protect, updateSuperAdminProfile);

//Instituteadmin
router.get("/Instituteadminprofile/:id", protect, getInstituteAdminProfile);
router.put("/Instituteadminprofile/:id", protect, updateInstituteAdminProfile);

module.exports = router;
