const path = require("path"); // ✅ Required for file extension
const StudentService = require("../services/studentService");
const CommonService = require("../services/commonService");
const studentService = require("../services/studentService");
const XLSX = require("xlsx");

const getAllStudent = async (req, res) => {
  try {
    const roleId = req.user.roleId; // from token ideally
    const userId = req.user.id;

    if (![1, 3, 4].includes(roleId)) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can get all students",
        {},
      );
    }

    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    const data = await StudentService.getAllStudent(
      roleId,
      userId,
      page,
      limit,
    );

    return CommonService.sendResponse(
      res,
      200,
      1,
      "All students fetched successfully!",
      data,
    );
  } catch (error) {
    console.error("Error fetching students:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};
const getStudentById = async (req, res) => {
  try {
    const roleId = req.user.roleId; // from token ideally
    const userId = req.user.id;

    if (![1, 3, 4].includes(roleId)) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can get student by id",
        {},
      );
    }

    const { id } = req.params;

    const data = await StudentService.getStudentById(id, roleId, userId);

    return CommonService.sendResponse(
      res,
      200,
      1,
      "Student data fetched successfully!",
      data,
    );  
  } catch (error) {
    console.error("Error fetching student by id:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};

const updateStudent = async (req, res) => {
  try {
    const roleId = req.user.roleId;
    const adminUserId = req.user.id;
    const { studentId } = req.params;

    if (![1, 3].includes(roleId)) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can update student",
        {},
      );
    }

    // 🔒 DELETE FORBIDDEN FIELDS (CONTROLLER RESPONSIBILITY)
    delete req.body.roleId;
    delete req.body.institute_id;
    delete req.body.approval_status;
    delete req.body.password;

    // ❌ Only Super Admin can toggle is_active
    if (roleId !== 1) {
      delete req.body.is_active;
    }

    const data = await StudentService.updateStudent(
      studentId,
      req.body,
      roleId,
      adminUserId,
    );

    return CommonService.sendResponse(
      res,
      200,
      1,
      "Student updated successfully",
      data,
    );
  } catch (error) {
    console.error("Admin update student error:", error);
    return CommonService.sendResponse(
      res,
      error.status || 500,
      0,
      error.message,
      [],
    );
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    let data = await studentService.deleteStudent(id);
    console.log(data);
    CommonService.sendResponse(
      res,
      200,
      1,
      "Student deleted successfully",
      data,
    );
  } catch (error) {
    console.error("Error deleting student:", error);
    CommonService.sendResponse(res, 500, 0, "Error deleting student", []);
  }
};

const approveStudent = async (req, res) => {
  const { id } = req.params;
  const data = await StudentService.updateApproval(id, "approved");
  return CommonService.sendResponse(res, 200, 1, "Approved", data);
};

const importStudent = async (req, res) => {
  try {
    const roleId = req.user.roleId;
    const adminUser = req.user;

    console.log("FILES:", req.files); // should show file object

    if (![1, 3].includes(roleId)) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can import students",
        {},
      );
    }

    // ✅ express-fileupload check
    if (!req.files || !req.files.file) {
      return CommonService.sendResponse(
        res,
        400,
        0,
        "Excel file is required",
        {},
      );
    }

    const workbook = XLSX.read(req.files.file.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return CommonService.sendResponse(res, 400, 0, "Invalid Excel file", {});
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
      return CommonService.sendResponse(res, 400, 0, "Excel file is empty", {});
    }

    const result = await StudentService.importStudents(rows, adminUser);

    return CommonService.sendResponse(
      res,
      200,
      1,
      "Student import completed",
      result,
    );
  } catch (error) {
    console.error("Import student error:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error importing students",
      [],
    );
  }
};

const exportStudent = async (req, res) => {
  try {
    const roleId = req.user.roleId; // from auth middleware
    const adminUser = req.user;

    // ================= ROLE CHECK =================
    if (![1, 3].includes(roleId)) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can export students",
        {},
      );
    }

    // ================= CALL SERVICE =================
    const { filePath, fileName } = await StudentService.exportStudent(
      roleId,
      adminUser,
    );

    // ================= DOWNLOAD FILE =================
    return res.download(filePath, fileName);
  } catch (error) {
    console.error("Export student controller error:", error);

    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error exporting students",
      [],
    );
  }
};

module.exports = {
  getAllStudent,
  updateStudent,
  deleteStudent,
  approveStudent,
  importStudent,
  exportStudent,
  getStudentById
};
