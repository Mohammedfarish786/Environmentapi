const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Adjust the path based on where you initialize your Sequelize instance

const RolePermission = sequelize.define(
  "RolePermission",
  {
    roleId: {
      type: DataTypes.INTEGER, // Use INTEGER for numeric fields
      references: {
        model: "Roles",
        key: "id",
      },
      allowNull: false,
    },
    permissionId: {
      type: DataTypes.INTEGER, // Use INTEGER for numeric fields
      references: {
        model: "Permissions", // Refers to the 'Permissions' table
        key: "id",
      },
      allowNull: false,
    },
    addPermission: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    editPermission: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    exportPermission: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    deletePermission: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: false, // Optionally disable the automatic 'createdAt' and 'updatedAt' fields
  },
);

module.exports = RolePermission;
