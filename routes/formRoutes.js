const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
  getAllForms,
  getSingleForm,
  createForm,
  updateForm,
  deleteForm,
} = require("../controllers/formController");

router.get("/", protect, getAllForms);
router.get("/:id", getSingleForm);
router.post("/", protect, createForm);
router.put("/:id", protect, updateForm);
router.delete("/:id", protect, deleteForm);

module.exports = router;
