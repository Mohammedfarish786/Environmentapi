const express = require("express");
const router = express.Router();

const {
  getAllIndividuals,
  updateIndividual,
  deleteIndividual,
  exportIndividuals,
} = require("../controllers/individualController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect, getAllIndividuals);
router.put("/:id", protect, updateIndividual);
router.delete("/:id", protect, deleteIndividual);
router.get("/export", protect, exportIndividuals);

module.exports = router;
