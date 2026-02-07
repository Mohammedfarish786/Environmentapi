const courseService = require("../services/courseService");
const CommonService = require("../services/commonService");
const ExcelJS = require("exceljs");
const commonService = require("../services/commonService");
// Get all courses
const getAllCourses = async (req, res) => {
  try {
    if (req.user.roleId !== 1 && req.user.roleId !== 3) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can get all courses",
        {},
      );
    }

    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    const data = await courseService.getAllCourses(page, limit);

    return CommonService.sendResponse(
      res,
      200,
      1,
      "All courses fetched successfully!",
      data,
    );
  } catch (error) {
    console.error("Error fetching courses:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};
const getCoursebyId = async (req, res) => {
  try {
    const roleId = req.user.roleId;
    if (roleId !== 1) {
      return CommonService.sendResponse(res, 403, 0, "Forbidden", {});
    }
    const { id } = req.params;
    const course = await courseService.getCourseById(id);
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Course fetched successfully!",
      course,
    );
  } catch (error) {
    console.error("Error fetching course:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};

// Create new course
const createCourse = async (req, res) => {
  try {
    const {
      course_name,
      about_course,
      description,
      thumbnail,
      price,
      duration,
      status,
      course_level,
      visibility,
      hashtags,
      total_weeks,
      total_ppt,
      what_you_will_learn,
      enroll_link,
      detail_link,
      contents,
    } = req.body;

    // Only Super Admin
    if (req.user.roleId !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can create course",
        {},
      );
    }

    const course = await courseService.createCourse({
      course_name,
      about_course,
      description,
      thumbnail,
      price,
      duration,
      status,
      visibility,
      hashtags,
      total_weeks,
      total_ppt,
      what_you_will_learn,
      enroll_link,
      detail_link,
      contents,
      course_level,
    });

    return CommonService.sendResponse(
      res,
      201,
      1,
      "Course created successfully!",
      course,
    );
  } catch (error) {
    console.error("Error creating course:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};

// Edit course
const editCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      course_name,
      about_course,
      description,
      thumbnail,
      price,
      duration,
      status,
      course_level,
      visibility,
      hashtags,
      total_weeks,
      total_ppt,
      what_you_will_learn,
      enroll_link,
      detail_link,
      contents,
    } = req.body;

    if (req.user.roleId !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can edit course",
        {},
      );
    }

    const updated = await courseService.editCourse(
      {
        course_name,
        description,
        thumbnail,
        price,
        duration,
        status,
        course_level,
        visibility,
        hashtags,
        total_weeks,
        total_ppt,
        what_you_will_learn,
        enroll_link,
        detail_link,
        contents,
      },
      id,
    );

    return CommonService.sendResponse(
      res,
      200,
      1,
      "Course updated successfully!",
      updated,
    );
  } catch (error) {
    console.error("Error updating course:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error updating course",
      [],
    );
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.roleId !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can delete course",
        {},
      );
    }
    const deleted = await courseService.deleteCourse(id);
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Course deleted successfully!",
      deleted,
    );
  } catch (error) {
    console.error("Error deleting course:", error);
    return CommonService.sendResponse(res, 500, 0, "Error deleting course", []);
  }
};
// Export courses

const exportCourses = async (req, res) => {
  try {
    const workbook = await courseService.exportCourses();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=Courses.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: 0,
      message: "Export failed",
    });
  }
};

const importCourses = async (req, res) => {
  try {
    console.log(req.files);

    if (req.user.roleId !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can import courses",
        {},
      );
    }

    if (!req.files || !req.files.file) {
      return CommonService.sendResponse(res, 400, 0, "No file uploaded", {});
    }

    const fileBuffer = req.files.file.data;

    const result = await courseService.importcourses(fileBuffer);

    let message = "Courses imported successfully!";
    let status = 1;

    if (result.success.length === 0 && result.failed.length > 0) {
      message = "All course rows failed to import";
      status = 0;
    } else if (result.success.length > 0 && result.failed.length > 0) {
      message = "Some courses imported successfully, some failed";
    }

    return CommonService.sendResponse(res, 200, status, message, result);
  } catch (error) {
    console.error("Error importing courses:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error importing courses",
      [],
    );
  }
};

module.exports = {
  getAllCourses,
  createCourse,
  editCourse,
  deleteCourse,
  exportCourses,
  importCourses,
  getCoursebyId,
};
