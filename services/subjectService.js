const Form = require("../models/form");
const Icon = require("../models/icon");
const { Op } = require("sequelize");

class subjectService {
  constructor() {
    if (subjectService.instance) {
      return subjectService.instance; // Return the existing instance if it exists
    }

    subjectService.instance = this; // Set the instance for future calls

    return this;
  }

  //displays all projects and their info
  async getAllSubjects() {
    try {
      const data = await Form.findAll({
        include: [
          {
            model: Icon,
            //   as: 'icon',
            required: false,
          },
        ],
      });

      console.log(data);
      return data;
    } catch (error) {
      console.error("Error fetching forms with icons:", error);
      throw error;
    }
  }

  async createCustomSubject(arg) {
    try {
      // Create icon first
      const iconData = await Icon.create({
        name: arg.name,
        uploaded_by: arg.uploaded_by,
        path: arg.path,
      });

      let formFieldsForDB = arg.form_fields;

      if (typeof formFieldsForDB === "object") {
        // For JSON column type - store as is
        // formFieldsForDB = JSON.stringify(formFieldsForDB);
      }

      // Create form with the icon_id
      const formData = await Form.create({
        form_name: arg.form_name,
        form_fields: formFieldsForDB, // ✅ Properly formatted
        icon_id: iconData.id,
      });

      return {
        form: formData,
        icon: iconData,
      };
    } catch (error) {
      console.error("Error creating custom subject:", error);
      throw new Error("Error creating custom subject");
    }
  }

  // async editProject(data, id) {
  //   try {
  //     const projects = await Projects.findByPk(id);
  //     if (!projects) {
  //       throw new Error('Project not found');
  //     }
  //     await projects.update(data);
  //     return projects;
  //   } catch (error) {
  //     console.error('Error editing project:', error);
  //     throw new Error('Error editing project');
  //   }
  // }
}

module.exports = new subjectService();
