const UserService = require("../services/userService");
const CommonService = require("../services/commonService");
const getAllPermission = async (req, res) => {
  const admin = req.admin;
  try {
    const permissions = await UserService.getAllPermissions();
    CommonService.sendResponse(res, 200, 1, "All permissions", permissions);
  } catch (error) {
    CommonService.sendResponse(
      res,
      500,
      0,
      "Error fetching permissions",
      error.message,
    );
  }
};

// Add these methods to adminController.js
const getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const rolePermissions = await UserService.getRolePermissions(roleId);
    CommonService.sendResponse(
      res,
      200,
      1,
      "Role permissions fetched successfully",
      rolePermissions,
    );
  } catch (error) {
    CommonService.sendResponse(
      res,
      500,
      0,
      "Error fetching role permissions",
      error.message,
    );
  }
};

const getRoleWithPermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const role = await UserService.getRoleWithPermissions(roleId);
    CommonService.sendResponse(
      res,
      200,
      1,
      "Role with permissions fetched successfully",
      role,
    );
  } catch (error) {
    CommonService.sendResponse(
      res,
      500,
      0,
      "Error fetching role with permissions",
      error.message,
    );
  }
};
const saveRole = async (req, res) => {
  try {
    const roleData = req.body;
    const savedRole = await UserService.saveRole(roleData);
    CommonService.sendResponse(
      res,
      200,
      1,
      "Role saved successfully",
      savedRole,
    );
  } catch (error) {
    console.error("Error saving role:", error);
    CommonService.sendResponse(res, 500, 0, "Error saving role", error.message);
  }
};
const getAllRoles = async (req, res) => {
  try {
    const roles = await UserService.getAllRoles();
    CommonService.sendResponse(res, 200, 1, "All roles", roles);
  } catch (error) {
    CommonService.sendResponse(
      res,
      500,
      0,
      "Error fetching roles",
      error.message,
    );
  }
};

module.exports = {
  getAllPermission,
  getRolePermissions,
  getRoleWithPermissions,
  saveRole, // Add this
  getAllRoles,
};
