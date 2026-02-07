const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CourseContent = sequelize.define(
  "CourseContent",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "courses",
        key: "id",
      },
    },

    month_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    week_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    content_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    content_type: {
      type: DataTypes.ENUM("ppt", "pdf", "video"),
      allowNull: false,
    },

    content_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "course_contents",
    timestamps: true,
  },
);

module.exports = CourseContent;
