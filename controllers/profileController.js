const ProfileService = require("../services/profileService");
const CommonService = require("../services/commonService");

// ---------- SUPER ADMIN ----------
const getSuperAdminProfile = async (req, res) => {
  try {
    const user = await ProfileService.getUserProfileById(req.user.id);
    return CommonService.sendResponse(res, 200, 1, "Profile fetched", user);
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

const updateSuperAdminProfile = async (req, res) => {
  try {
    const user = await ProfileService.updateUserProfileById(
      req.user.id,
      req.body,
    );
    return CommonService.sendResponse(res, 200, 1, "Profile updated", user);
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

// ---------- INSTITUTE ADMIN ----------
const getInstituteAdminProfile = async (req, res) => {
  try {
    const user = await ProfileService.getUserProfileById(req.user.id);
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Institute Admin profile fetched",
      user,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

const updateInstituteAdminProfile = async (req, res) => {
  try {
    const user = await ProfileService.updateUserProfileById(
      req.user.id,
      req.body,
    );
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Institute Admin profile updated",
      user,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

// ---------- TEACHER ----------
const getTeacherProfile = async (req, res) => {
  try {
    const roleID = req.user.roleId;
    const userID = req.user.id;
    if (roleID !== 1 && roleID !== 3 && roleID !== 4)
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only authorized users can fetch teacher profile",
        {},
      );
    const teacher = await ProfileService.getTeacherProfileByUserId(
      req.user.id,
      userID,
      roleID,
    );
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Teacher profile fetched",
      teacher,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

const updateTeacherProfile = async (req, res) => {
  try {
    const roleID = req.user.roleId;
    const userID = req.user.id;
    if (roleID !== 1 && roleID !== 3 && roleID !== 4)
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only authorized users can update teacher profile",
        {},
      );
    const teacher = await ProfileService.updateTeacherProfileByUserId(
      req.user.id,
      req.body,
      userID,
      roleID,
    );
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Teacher profile updated",
      teacher,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

// ---------- STUDENT ----------
const getStudentProfile = async (req, res) => {
  try {
    const roleID = req.user.roleId;
    const userID = req.user.id;
    if (roleID !== 1 && roleID !== 3 && roleID !== 4)
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only authorized users can fetch student profile",
        {},
      );
    const student = await ProfileService.getStudentProfileByUserId(
      req.user.id,
      userID,
    );
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Student profile fetched",
      student,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    const roleID = req.user.roleId;
    const userID = req.user.id;
    if (roleID !== 1 && roleID !== 3 && roleID !== 4)
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only authorized users can update student profile",
        {},
      );
    const student = await ProfileService.updateStudentProfileByUserId(
      req.user.id,
      req.body,
      userID,
    );
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Student profile updated",
      student,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};
// ----------INDIVIDUAL ----------
const getIndividualProfile = async (req, res) => {
  try {
    const roleID = req.user.roleId;
    const userID = req.user.id;
    if (roleID !== 1 && roleID !== 6)
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only authorized users can fetch individual profile",
        {},
      );
    const individual = await ProfileService.getIndividualProfileById(
      req.params.id,
      userID,
      roleID,
    );
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Individual profile fetched",
      individual,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};
const updateIndividualProfile = async (req, res) => {
  try {
    const roleID = req.user.roleId;
    const userID = req.user.id;
    if (roleID !== 1 && roleID !== 6)
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only authorized users can update individual profile",
        {},
      );
    const individual = await ProfileService.updateIndividualProfileById(
      req.params.id,
      req.body,
      userID,
      roleID,
    );
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Individual profile updated",
      individual,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};
// ---------- EMPLOYEE ----------
const getEmployeeProfile = async (req, res) => {
  try {
    const roleID = req.user.roleId;
    const userID = req.user.id;
    if (roleID !== 1 && roleID !== 2)
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only authorized users can fetch employee profile",
        {},
      );
    const employee = await ProfileService.getUserProfileById(
      req.params.id,
      userID,
      roleID,
    );
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Employee profile fetched",
      employee,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

const updateEmployeeProfile = async (req, res) => {
  try {
    const roleID = req.user.roleId;
    const userID = req.user.id;
    if (roleID !== 1 && roleID !== 2)
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only authorized users can update employee profile",
        {},
      );
    const employee = await ProfileService.updateUserProfileById(
      req.params.id,
      req.body,
      userID,
      roleID,
    );
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Employee profile updated",
      employee,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

// ---------- INSTITUTE ----------
const getInstituteProfile = async (req, res) => {
  try {
    const roleID = req.user.roleId;
    const userID = req.user.id;
    if (roleID !== 1 && roleID !== 3)
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only authorized users can fetch institute profile",
        {},
      );
    const institute = await ProfileService.getInstituteProfileById(
      req.params.id,
      userID,
      roleID,
    );
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Institute profile fetched",
      institute,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

const updateInstituteProfile = async (req, res) => {
  try {
    const roleID = req.user.roleId;
    const userID = req.user.id;
    if (roleID !== 1 && roleID !== 3)
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only authorized users can update institute profile",
        {},
      );
    const institute = await ProfileService.updateInstituteProfileById(
      req.params.id,
      req.body,
      userID,
      roleID,
    );
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Institute profile updated",
      institute,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

module.exports = {
  getSuperAdminProfile,
  updateSuperAdminProfile,
  getInstituteAdminProfile,
  updateInstituteAdminProfile,
  getTeacherProfile,
  updateTeacherProfile,
  getEmployeeProfile,
  updateEmployeeProfile,
  getIndividualProfile,
  updateIndividualProfile,
  getStudentProfile,
  updateStudentProfile,
  getInstituteProfile,
  updateInstituteProfile,
};
