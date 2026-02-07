const express = require("express");
const {
  getAllPermission,
  getRolePermissions,
  getRoleWithPermissions,
  saveRole, // Add this
  getAllRoles,
} = require("../controllers/adminController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/permission", protect, getAllPermission);
router.get("/:roleId/permissions", protect, getRolePermissions);
router.get("/:roleId/with-permissions", protect, getRoleWithPermissions);
router.post("/role", protect, saveRole);
router.get("/role", protect, getAllRoles);

module.exports = router;
