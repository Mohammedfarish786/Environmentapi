const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Permission = sequelize.define(
  "Permission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: DataTypes.INTEGER,
    },
    label: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING },
    route: { type: DataTypes.STRING },
    component: { type: DataTypes.STRING },
    parentId: { type: DataTypes.STRING },
    icon: { type: DataTypes.STRING },
    type: { type: DataTypes.INTEGER },
    isMenu: { type: DataTypes.INTEGER },
    order: { type: DataTypes.INTEGER },
  },
  {
    tableName: "permissions",
  },
);

module.exports = Permission;
