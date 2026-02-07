const instructorService = require("../services/instructorService");
const CommonService = require("../services/commonService");
const emailService = require("../services/emailService");
const Instructor = require("../models/Instructor");
const User = require("../models/User");

// GET
const getAllInstructors = async (req, res) => {
  try {
    if (![1, 3].includes(req.user.roleId))
      return CommonService.sendResponse(res, 403, 0, "Forbidden", {});
    let instituteId = null;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const userId = req.user.id;
    if (req.user.roleId === 3)
    {
      const user = await User.findOne({ where: { id: userId } });
      instituteId = user.institute_id;
      if (user.institute_id === null) {
        return CommonService.sendResponse(res, 403, 0, "Forbidden", {});
      }
    }
    if (req.query.institute_id) {
      instituteId = req.query.institute_id;
    }
    console.log(instituteId);
    console.log(req.query);
    const filters = { ...req.query };
    delete filters.page;
    delete filters.limit;
    delete filters.institute_id;
    const result = await instructorService.getAllInstructors({
      institutionId: instituteId,
      page,
      limit,
      filters,
    });

    return CommonService.sendResponse(res, 200, 1, result.message, result);
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

const getInstructorById = async (req, res) => {
  try {
    if (![1, 3].includes(req.user.roleId))
      return CommonService.sendResponse(res, 403, 0, "Forbidden", {});

    const { user_id } = req.params;
    const data = await instructorService.getInstructorById(user_id);
    return CommonService.sendResponse(res, 200, 1, "Instructor fetched", data);
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

// UPDATE
const updateInstructor = async (req, res) => {
  try {
    if (![1, 3].includes(req.user.roleId))
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden! Only admin can update",
        {},
      );

    const { user_id } = req.params;

    // Institute admin ownership check
    if (req.user.roleId === 3) {
      const inst = await Instructor.findOne({ where: { user_id } });
      if (!inst)
        return CommonService.sendResponse(
          res,
          404,
          0,
          "Instructor not found",
          {},
        );

      if (inst.institute_id !== req.user.institute_id)
        return CommonService.sendResponse(
          res,
          403,
          0,
          "Forbidden!only respective admin can update",
          {},
        );
    }

    const data = await instructorService.updateInstructor(user_id, req.body);
    return CommonService.sendResponse(res, 200, 1, "Instructor updated", data);
  } catch (error) {
    return CommonService.sendResponse(
      res,
      error.status || 500,
      0,
      error.message,
      {},
    );
  }
};

// DELETE
const deleteInstructor = async (req, res) => {
  try {
    if (![1, 3].includes(req.user.roleId))
      return CommonService.sendResponse(res, 403, 0, "Forbidden", {});

    const result = await instructorService.deleteInstructors(
      [req.params.user_id],
      req.user.roleId,
      req.user.institute_id,
    );

    return CommonService.sendResponse(
      res,
      200,
      1,
      "Instructor deleted",
      result,
    );
  } catch (error) {
    return CommonService.sendResponse(
      res,
      error.status || 500,
      0,
      error.message,
      {},
    );
  }
};

// IMPORT
const importInstructor = async (req, res) => {
  try {
    if (![1, 3].includes(req.user.roleId)) {
      return CommonService.sendResponse(res, 403, 0, "Forbidden", {});
    }
    const { instituteId } = req.body;
    // ✅ express-fileupload check
    if (!req.files || !req.files.file) {
      return CommonService.sendResponse(res, 400, 0, "No file uploaded", {});
    }

    const fileBuffer = req.files.file.data;

    const result = await instructorService.importInstructors(
      fileBuffer,
      req.user,
      instituteId,
    );

    return CommonService.sendResponse(res, 200, 1, "Import completed", result);
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

// EXPORT (placeholder)
const exportInstructor = async (req, res) => {
  try {
    // Role check
    if (![1, 3].includes(req.user.roleId)) {
      return CommonService.sendResponse(res, 403, 0, "Forbidden", {});
    }
    const roleId = req.user.roleId;
    const userId = req.user.id;
    // 📤 Service will stream Excel directly
    await instructorService.exportInstructors(roleId, userId, res);
  } catch (error) {
    console.error("Export Instructor Controller Error:", error);
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

// APPROVE
const approveInstructor = async (req, res) => {
  try {
    const { userId, approval_status } = req.body;

    if (!userId || !approval_status)
      return CommonService.sendResponse(
        res,
        400,
        0,
        "userId & approved required",
        {},
      );

    if (![1, 3].includes(req.user.roleId))
      return CommonService.sendResponse(res, 403, 0, "Forbidden", {});

    const result = await instructorService.approveInstructor(
      userId,
      approval_status,
      req.user.roleId,
      req.user.institute_id,
    );

    const user = await User.findByPk(userId);

    await emailService.sendEmail({
      to: user.email,
      subject: "Instructor Approval",
      html: approval_status
        ? "<p>Your instructor account has been approved.</p>"
        : "<p>Your instructor account has been rejected.</p>",
    });

    return CommonService.sendResponse(res, 200, 1, "Approval updated", result);
  } catch (error) {
    return CommonService.sendResponse(
      res,
      error.status || 500,
      0,
      error.message,
      {},
    );
  }
};

module.exports = {
  getAllInstructors,
  updateInstructor,
  deleteInstructor,
  importInstructor,
  exportInstructor,
  approveInstructor,
  getInstructorById,
};
