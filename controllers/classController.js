const ClassService = require("../services/classService");
const CommonService = require("../services/commonService");
const User = require("../models/User");
// CREATE
const createClass = async (req, res) => {
  try {
    if (![1, 3].includes(req.user.roleId))
      return CommonService.sendResponse(res, 403, 0, "Forbidden", {});

    const data = await ClassService.createClass(req.body, req.user);
    return CommonService.sendResponse(
      res,
      201,
      1,
      "Class created successfully",
      data,
    );
  } catch (error) {
    return CommonService.sendResponse(
      res,
      error.status || 500,
      0,
      error.message || "Internal Server Error",
      {},
    );
  }
};

// GET ALL
const getAllClasses = async (req, res) => {
  try {
    let instituteId = null;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const userId = req.user.id;
    if (req.user.roleId === 3) {
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

    const data = await ClassService.getAllClasses({
      page,
      limit,
      filters,
      instituteId,
    });

    return CommonService.sendResponse(
      res,
      200,
      1,
      "Classes fetched successfully",
      data,
    );
  } catch (error) {
    console.error(error);
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

// UPDATE
const updateClass = async (req, res) => {
  try {
    if (![1, 3].includes(req.user.roleId))
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden!only admin can update classes",
        {},
      );

    const data = await ClassService.updateClass(
      req.params.id,
      req.body,
      req.user,
    );
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Class updated successfully",
      data,
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

// DELETE
const deleteClass = async (req, res) => {
  try {
    if (![1, 3].includes(req.user.roleId))
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden!only admin can delete classes",
        {},
      );

    await ClassService.deleteClass(req.params.id, req.user);
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Class deleted successfully",
      {},
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
const importClass = async (req, res) => {
  try {
    if (![1, 3].includes(req.user.roleId))
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden!only admin can import classes",
        {},
      );
    if (!req.files?.file)
      return CommonService.sendResponse(res, 400, 0, "No file uploaded", {});

    const result = await ClassService.importClasses(
      req.files.file.data,
      req.user,
    );

    return CommonService.sendResponse(res, 200, 1, "Import completed", result);
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

// EXPORT
const exportClass = async (req, res) => {
  try {
    if (![1, 3].includes(req.user.roleId))
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden!only admin can export classes",
        {},
      );
    const fileBuffer = await ClassService.exportClasses(req.user);

    res.setHeader("Content-Disposition", "attachment; filename=classes.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    return res.send(fileBuffer);
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

module.exports = {
  createClass,
  getAllClasses,
  updateClass,
  deleteClass,
  importClass,
  exportClass,
};
