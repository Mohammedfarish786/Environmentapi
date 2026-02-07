const express = require("express");
const {
  getAllSubjects,
  createCustomSubject,
} = require("../controllers/subjectController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();
router.get("/", protect, getAllSubjects);
router.post("/", protect, createCustomSubject);
module.exports = router;
