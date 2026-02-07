const IndividualService = require("../services/individualService");
const CommonService = require("../services/commonService");

const getAllIndividuals = async (req, res) => {
  try {
    if (req.user.roleId !== 1) {
      return res.status(403).json({
        success: 0,
        message: "Forbidden: Only super admin allowed",
      });
    }
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const data = await IndividualService.getAllIndividuals(page, limit);

    return CommonService.sendResponse(
      res,
      200,
      1,
      "Individuals fetched successfully",
      data,
    );
  } catch (error) {
    console.error("Get individuals error:", error);
    return CommonService.sendResponse(res, 500, 0, error.message, []);
  }
};

const updateIndividual = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.roleId !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only super admin allowed",
        {},
      );
    }

    // 🔒 DELETE FORBIDDEN FIELDS (CONTROLLER ONLY)
    delete req.body.roleId;
    delete req.body.institute_id;
    delete req.body.password;
    delete req.body.reset_otp;
    delete req.body.reset_otp_expiry;
    delete req.body.otp_verified;

    const data = await IndividualService.updateIndividual(id, req.body);

    return CommonService.sendResponse(
      res,
      200,
      1,
      "Individual updated successfully",
      data,
    );
  } catch (error) {
    console.error("Update individual error:", error);
    return CommonService.sendResponse(
      res,
      error.status || 500,
      0,
      error.message,
      [],
    );
  }
};

const deleteIndividual = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.roleId !== 1) {
      return res.status(403).json({
        success: 0,
        message: "Forbidden: Only super admin allowed",
      });
    }
    await IndividualService.deleteIndividual(id);

    return CommonService.sendResponse(
      res,
      200,
      1,
      "Individual deleted successfully",
      {},
    );
  } catch (error) {
    console.error("Delete individual error:", error);
    return CommonService.sendResponse(res, 500, 0, error.message, []);
  }
};

const exportIndividuals = async (req, res) => {
  try {
    if (req.user.roleId !== 1) {
      return res.status(403).json({
        success: 0,
        message: "Forbidden: Only super admin allowed",
      });
    }
    const { filePath, fileName } = await IndividualService.exportIndividuals();

    return res.download(filePath, fileName);
  } catch (error) {
    console.error("Export individuals error:", error);
    return CommonService.sendResponse(res, 500, 0, error.message, []);
  }
};

module.exports = {
  getAllIndividuals,
  updateIndividual,
  deleteIndividual,
  exportIndividuals,
};
