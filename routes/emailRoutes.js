const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
  getAllTemplates,
  getSingleTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendEmailByTemplate
} = require("../controllers/emailTemplateController");

// CRUD
router.get("/", protect, getAllTemplates);
router.get("/:id", protect, getSingleTemplate);
router.post("/", protect, createTemplate);
router.put("/:id", protect, updateTemplate);
router.delete("/:id", protect, deleteTemplate);

// Send email using template
router.post("/send/:id", protect, sendEmailByTemplate);

module.exports = router;
