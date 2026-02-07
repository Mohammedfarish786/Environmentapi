const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Class = sequelize.define(
  "Class",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    grade: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    section: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    class_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 100,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    institute_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "institutes",
        key: "id",
      },
    },
  },
  {
    tableName: "classes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    // ✅ ADD INDEXES HERE
    indexes: [
      {
        unique: true,
        fields: ["grade", "section", "institute_id"],
      },
    ],
  }
);

module.exports = Class;

