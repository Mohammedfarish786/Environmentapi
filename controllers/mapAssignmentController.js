const path = require("path"); // ✅ Required for file extension
const mapAssignmentService = require("../services/mapAssignmentService");
const CommonService = require("../services/commonService");

const retrieveProgress = async (req, res) => {
  try {
    const { assigned_by } = req.params;
    const data = await mapAssignmentService.retrieveProgress(assigned_by);
    console.log(data);
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Progress retrieved successfully!",
      data,
    );
  } catch (error) {
    console.error("Progress retrieved successfully:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};

const mapAssignment = async (req, res) => {
  try {
    const { school_id, assigned_by, grid_coordinates } = req.body;

    const mapAssignmentData = await mapAssignmentService.mapAssignment({
      school_id,
      assigned_by,
      grid_coordinates,
    });

    console.log(mapAssignmentData);
    return CommonService.sendResponse(
      res,
      200,
      1,
      "Grid Assigned to School successfully!",
      mapAssignmentData,
    );
  } catch (error) {
    console.error("Error assigning grid to school:", error);
    return CommonService.sendResponse(
      res,
      500,
      0,
      error.message || "Error",
      [],
    );
  }
};

module.exports = {
  retrieveProgress,
  mapAssignment,
};
