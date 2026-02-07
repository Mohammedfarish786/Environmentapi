const formService = require("../services/formService");
const CommonService = require("../services/commonService");

// GET ALL
const getAllForms = async (req, res) => {
  try {
    const data = await formService.getAllForms();
    return CommonService.sendResponse(res, 200, 1, "Forms fetched", data);
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

// GET ONE
const getSingleForm = async (req, res) => {
  try {
    const data = await formService.getFormById(req.params.id);
    return CommonService.sendResponse(res, 200, 1, "Form fetched", data);
  } catch (error) {
    return CommonService.sendResponse(res, 404, 0, error.message, {});
  }
};

// CREATE
const createForm = async (req, res) => {
  try {
    const data = await formService.createForm(req.body);
    return CommonService.sendResponse(res, 201, 1, "Form created", data);
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

// UPDATE
const updateForm = async (req, res) => {
  try {
    const data = await formService.updateForm(req.params.id, req.body);
    return CommonService.sendResponse(res, 200, 1, "Form updated", data);
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

// DELETE
const deleteForm = async (req, res) => {
  try {
    const data = await formService.deleteForm(req.params.id);
    return CommonService.sendResponse(res, 200, 1, "Form deleted", data);
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};

module.exports = {
  getAllForms,
  getSingleForm,
  createForm,
  updateForm,
  deleteForm,
};
