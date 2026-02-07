const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CourseInstitute = sequelize.define(
  "CourseInstitute",
  {
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: "courses", key: "id" },
    },

    institute_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: "institutes", key: "id" },
    },

    class_id: {
      type: DataTypes.INTEGER,
      allowNull: false, // ← now NOT NULL
      primaryKey: true, // ← part of composite PK
      references: { model: "classes", key: "id" },
    },

    instructor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "instructors", key: "id" },
    },
  },
  {
    tableName: "course_institute",
    timestamps: false,
    underscored: true,
  },
);

module.exports = CourseInstitute;
