// models/MapAssignment.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MapAssignment = sequelize.define(
  "MapAssignment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    school_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // references: {
      //   model: 'schools',
      //   key: 'id'
      // }
    },
    assigned_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // references: {
      //   model: 'users',
      //   key: 'id'
      // }
    },
    grid_coordinates: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    tableName: "map_assignments",
    timestamps: true,
    createdAt: "assigned_at",
    updatedAt: "updated_at",
  },
);

module.exports = MapAssignment;
