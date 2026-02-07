const express = require("express");
//const { login,  changePassword, forgotPassword, registerInstitute, registerIndividual, registerStudent, registerTeacher, checkOtp} = require('../controllers/authController');
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();
//Common Route without login
router.get("/constants", login);
router.get("/location/countries", registerInstitute);
router.get("/location/states/:countryId", registerStudent);
router.get("/location/districts/:stateId", registerTeacher);
router.post("/email", registerTeacher);

module.exports = router;
