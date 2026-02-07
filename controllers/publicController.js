const publicService = require("../services/publicService");
const CommonService = require("../services/commonService");

const getHomepage = async (req, res) => {
  try {
    const data = await publicService.getHomepage(req, res);
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Homepage data fetched successfully!",
      data,
    );
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};
const getcontentPage = async (req, res) => {
  try {
    const data = await publicService.getContentPage(req.params.slug);
    console.log(req.params.slug);
    if (!data) {
      return CommonService.sendResponse(res, 404, 0, "Page not found", []);
    }
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Page fetched successfully!",
      data,
    );
  } catch (error) {
    console.error("Error fetching content page data:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};
const getGalleryPage = async (req, res) => {
  try {
    // Placeholder for gallery page logic
    const data = await publicService.getGalleryPage(req, res);
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Gallery page fetched successfully!",
      data,
    );
  } catch (error) {
    console.error("Error fetching gallery page data:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};
const getconstant = async (req, res) => {
  try {
    const data = await publicService.getconstant(req.params.slug);
    if (!data) {
      return CommonService.sendResponse(res, 404, 0, "Page not found", []);
    }
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Constant fetched successfully!",
      data,
    );
  } catch (error) {
    console.error("Error fetching content page data:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};
const getCountries = async (req, res) => {
  try {
    const data = await publicService.getcountries();
    if (!data) {
      return CommonService.sendResponse(res, 404, 0, "Page not found", []);
    }
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Countries fetched successfully!",
      data,
    );
  } catch (error) {
    console.error("Error fetching content page data:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};
const getstates = async (req, res) => {
  try {
    const { countryId } = req.params;
    const data = await publicService.getstates(countryId);

    console.log(countryId);
    if (!data) {
      return CommonService.sendResponse(res, 404, 0, "Page not found", []);
    }
    return CommonService.sendResponse(
      res,
      200,
      1,
      "States fetched successfully!",
      data,
    );
  } catch (error) {
    console.error("Error fetching content page data:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};
const getcities = async (req, res) => {
  try {
    const data = await publicService.getcities(req.params.stateId);
    if (!data) {
      return CommonService.sendResponse(res, 404, 0, "Page not found", []);
    }
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Cities fetched successfully!",
      data,
    );
  } catch (error) {
    console.error("Error fetching content page data:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};
const submitForm = async (req, res) => {
  try {
    const data = await publicService.processSubmission(req.body);

    return CommonService.sendResponse(
      res,
      200,
      1,
      "Form submitted successfully",
      data,
    );
  } catch (error) {
    return CommonService.sendResponse(res, 500, 0, error.message, {});
  }
};
const activateIndividualAccount = async (req, res) => {
  try {
    const { token } = req.query;

    await publicService.activateIndividualAccount(token);

    return CommonService.sendResponse(
      res,
      200,
      1,
      "Account activated successfully",
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
module.exports = {
  getHomepage,
  getcontentPage,
  getGalleryPage,
  getconstant,
  getCountries,
  getstates,
  getcities,
  submitForm,
  activateIndividualAccount,
};
