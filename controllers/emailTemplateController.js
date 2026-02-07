const emailTemplateService = require("../services/emailTemplateService");
const CommonService = require("../services/commonService");

// GET ALL
const getAllTemplates = async (req, res) => {
  try {
    const roleId = req.user.roleId;
    if (roleId !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can get all templates",
        {}
      );
    }
    const data = await emailTemplateService.getAllTemplates();
    return CommonService.sendResponse(res, 200, 1, "Templates fetched", data);
  } catch (err) {
    return CommonService.sendResponse(res, 500, 0, err.message, {});
  }
};

// GET SINGLE
const getSingleTemplate = async (req, res) => {
  try {
    const data = await emailTemplateService.getTemplateById(req.params.id);
    return CommonService.sendResponse(res, 200, 1, "Template fetched", data);
  } catch (err) {
    return CommonService.sendResponse(res, 404, 0, err.message, {});
  }
};

// CREATE
const createTemplate = async (req, res) => {
  try {
    const roleId = req.user.roleId;
    if (roleId !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can create template",
        {}
      );
    }
    const data = await emailTemplateService.createTemplate(req.body);
    return CommonService.sendResponse(res, 201, 1, "Template created", data);
  } catch (err) {
    return CommonService.sendResponse(res, 500, 0, err.message, {});
  }
};

// UPDATE
const updateTemplate = async (req, res) => {
  try {
    const roleId = req.user.roleId;
    if (roleId !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can update template",
        {}
      );
    }
    const data = await emailTemplateService.updateTemplate(req.params.id, req.body);
    return CommonService.sendResponse(res, 200, 1, "Template updated", data);
  } catch (err) {
    return CommonService.sendResponse(res, 500, 0, err.message, {});
  }
};

// DELETE
const deleteTemplate = async (req, res) => {
  try {
    const roleId = req.user.roleId;
    if (roleId !== 1) {
      return CommonService.sendResponse(
        res,
        403,
        0,
        "Forbidden: Only admin can delete template",
        {}
      );
    }
    const data = await emailTemplateService.deleteTemplate(req.params.id);
    return CommonService.sendResponse(res, 200, 1, "Template deleted", data);
  } catch (err) {
    return CommonService.sendResponse(res, 500, 0, err.message, {});
  }
};

// SEND EMAIL USING TEMPLATE
const sendEmailByTemplate = async (req, res) => {
  try {
    const { to, variables } = req.body;
    const data = await emailTemplateService.sendEmailUsingTemplate(
      req.params.id,
      to,
      variables
    );
    return CommonService.sendResponse(res, 200, 1, "Email sent", data);
  } catch (err) {
    return CommonService.sendResponse(res, 500, 0, err.message, {});
  }
};

module.exports = {
  getAllTemplates,
  getSingleTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendEmailByTemplate
};
