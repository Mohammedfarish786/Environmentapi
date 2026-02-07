const Map = require("../models/map");
const { Op, where } = require("sequelize");

class MapService {
  constructor() {
    if (MapService.instance) {
      return MapService.instance;
    }
    MapService.instance = this;
    return this;
  }

  async retrieveProgress(user_id) {
    try {
      const latestProgress = await Map.findOne({
        where: { user_id: user_id },
        order: [["created_at", "DESC"]],
      });
      return latestProgress;
    } catch (error) {
      console.error("Error fetching latest progress:", error);
      throw new Error("Error fetching latest progress: " + error.message);
    }
  }

  async saveProgress(data) {
    try {
      // Create user first
      const progress = await Map.create(data);
      return progress;
    } catch (error) {
      console.error("Error saving progress", error);
      throw new Error("Error saving progress: " + error.message);
    }
  }

  //   // Update user basic information
  //   async updateStudent(updateData,id) {
  //     try {
  //       const student = await User.findOne({where:{id:id}});
  //       if (!student) {
  //         throw new Error('Student not found');
  //       }

  //       await student.update(updateData);
  //       return student;
  //     } catch (error) {
  //       console.error('Error updating student:', error);
  //       throw new Error('Error updating student: ' + error.message);
  //     }
  //   }

  //   async deleteStudent(id) {
  //     try {
  //       const student = await User.findOne({ where: { id } });
  //       if (!student) {
  //         throw new Error("Student not found");
  //       }

  //       await student.destroy();
  //       return;
  //     } catch (error) {
  //       console.error("Error deleting student:", error);
  //       throw new Error("Error deleting student: " + error.message);
  //     }
  //   }
}

module.exports = new MapService();
