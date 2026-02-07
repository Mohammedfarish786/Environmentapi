const MapAssignments = require("../models/MapAssignments");
const { Op, where } = require("sequelize");

class mapAssignmentService {
  constructor() {
    if (mapAssignmentService.instance) {
      return mapAssignmentService.instance;
    }
    mapAssignmentService.instance = this;
    return this;
  }

  async retrieveProgress(assigned_by) {
    try {
      const mapAssignment = await MapAssignments.findAll({
        where: { assigned_by: assigned_by },
      });
      return mapAssignment;
    } catch (error) {
      console.error("Error retrieving progress", error);
      throw new Error("Error retrieving progress: " + error.message);
    }
  }

  async mapAssignment(data) {
    try {
      // Create user first
      const mapAssignment = await MapAssignments.create(data);
      return mapAssignment;
    } catch (error) {
      console.error("Error assigning grid to school", error);
      throw new Error("Error assigning grid to school: " + error.message);
    }
  }
}

module.exports = new mapAssignmentService();
