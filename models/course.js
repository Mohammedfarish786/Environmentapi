const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Course = sequelize.define(
  "Course",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    course_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    about_course: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    thumbnail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    duration: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    course_level: {
      type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
      allowNull: false,
    },

    visibility: {
      type: DataTypes.ENUM("public", "private"),
      defaultValue: "public",
    },

    hashtags: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    total_weeks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    total_ppt: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    what_you_will_learn: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    enroll_link: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    detail_link: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  {
    tableName: "courses",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Course;
