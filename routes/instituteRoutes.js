const express = require("express");
const {
  getAllInstitute,
  approveInstitute,
  updateInstitute,
  deleteInstitute,
  importInstitute,
  exportInstitute,
} = require("../controllers/instituteController");
const { registerInstitute } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();
router.get("/", protect, getAllInstitute); //displays all institutes
router.post("/", protect, registerInstitute); //create a new institute
router.put("/approvestatus/:id", protect, approveInstitute); //approve a institute
router.put("/:id", protect, updateInstitute); //edit a institute
router.delete("/:id", protect, deleteInstitute); //delete a institute
router.post("/import", protect, importInstitute); //import institutes
router.get("/export", protect, exportInstitute); //export all institutes
module.exports = router;
