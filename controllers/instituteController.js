const path = require("path"); // ✅ Required for file extension
const InstituteService = require("../services/instituteService");
const CommonService = require("../services/commonService");

const getAllInstitute = async (req, res) => {
  try {
    const roleID = req.user.roleId;

    if (roleID !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can get all Institutes",
        {},
      );
    }

    // pagination
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    // dynamic filters (everything except page & limit)
    const filters = { ...req.query };
    delete filters.page;
    delete filters.limit;

    const data = await InstituteService.getAllInstitute(
      page,
      limit,
      filters,
      req.user,
    );

    return CommonService.sendResponse(
      res,
      200,
      1,
      "All Institutes data fetched successfully!",
      data,
    );
  } catch (error) {
    console.error("Error fetching institutes:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};
// const getInstituteById = async (req, res) => {
//   try {
//     const roleID = req.user.roleId;

//     if (roleID !== 1) {
//       return CommonService.sendResponse(
//         res,
//         403,
//         0,
//         "Forbidden: Only admin can get Institute by id",
//         {},
//       );
//     }

//     const { id } = req.params;

//     const data = await InstituteService.getInstituteById(id);

//     return CommonService.sendResponse(
//       res,
//       200,
//       1,
//       "Institute data fetched successfully!",
//       data,
//     );

//   } catch (error) {
//     console.error("Error fetching Institute by id:", error);
//     return CommonService.sendResponse(
//       res,
//       500,
//       0,
//       error.message || "Error",
//       [],
//     );
//   }
// };

const updateInstitute = async (req, res) => {
  try {
    const roleID = req.user.roleId;

    if (roleID !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can update Institute",
        {},
      );
    }

    const { id } = req.params;

    const updateData = req.body;

    // ❌ remove forbidden fields
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;
    delete updateData.representative_id;
    delete updateData.approvedstatus;
    delete updateData.is_active;
    delete updateData.institute_code; // permanent code

    const data = await InstituteService.updateInstitute(updateData, id);

    return CommonService.sendResponse(
      res,
      200,
      1,
      "Institute updated successfully",
      data,
    );
  } catch (error) {
    console.error("Error updating Institute:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      "Error updating Institute",
      [],
    );
  }
};

const approveInstitute = async (req, res) => {
  try {
    const { id } = req.params;
    const roleID = req.user.roleId;
    const { approval_status } = req.body;
    console.log("test", approval_status);
    if (roleID !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can approve Institute",
        {},
      );
    }
    let data = await InstituteService.approveInstitute(id, approval_status);
    console.log(data);
    CommonService.sendResponse(
      res,
      200,
      1,
      "Institute approvestatus updated successfully",
      data,
    );
  } catch (error) {
    console.error("Error approving Institute:", error);
    CommonService.sendResponse(res, 500, 0, "Error approving Institute", []);
  }
};
const deleteInstitute = async (req, res) => {
  try {
    const { id } = req.params;
    const roleID = req.user.roleId;
    if (roleID !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can delete Institute",
        {},
      );
    }
    let data = await InstituteService.deleteInstitute(id);
    console.log(data);
    CommonService.sendResponse(
      res,
      200,
      1,
      "Institute deleted successfully",
      data,
    );
  } catch (error) {
    console.error("Error deleting Institute:", error);
    CommonService.sendResponse(res, 500, 0, "Error deleting Institute", []);
  }
};
const importInstitute = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return CommonService.sendResponse(res, 400, 0, "No file uploaded", {});
    }

    const fileBuffer = req.files.file.data;
    console.log(fileBuffer);
    const result = await InstituteService.importinstitutes(fileBuffer);

    let message = "Institute imported successfully";
    let status = 1;

    if (result.success.length === 0 && result.failed.length > 0) {
      message = "All institute rows failed to import";
      status = 0;
    } else if (result.success.length > 0 && result.failed.length > 0) {
      message = "Some institutes imported successfully, some failed";
    }

    return CommonService.sendResponse(res, 200, status, message, result);
  } catch (error) {
    console.error("Error importing Institute:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error importing institutes",
      [],
    );
  }
};

const exportInstitute = async (req, res) => {
  try {
    if (req.user.roleId !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can export data",
        {},
      );
    }

    const fileBuffer = await InstituteService.exportinstitutes();

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=full_institute_export.xlsx",
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    return res.send(fileBuffer);
  } catch (error) {
    console.error("Error exporting institute data:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Export failed",
      [],
    );
  }
};

module.exports = {
  getAllInstitute,
  updateInstitute,
  deleteInstitute,
  importInstitute,
  exportInstitute,
  approveInstitute,
};
