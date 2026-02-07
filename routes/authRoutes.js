const express = require("express");
const {
  login,
  changePassword,
  forgotPassword,
  registerInstitute,
  registerIndividual,
  registerStudent,
  registerTeacher,
  checkOtp,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();
router.post("/signin", login);
router.post("/register/institute", registerInstitute);
router.post("/register/student", registerStudent);
router.post("/register/teacher", registerTeacher);
router.post("/register/individual", registerIndividual);
router.post("/check-otp", checkOtp);
router.post("/forgot-password", forgotPassword);
router.post("/change-password", protect, changePassword);
router.post("/reset-password", changePassword);

module.exports = router;
