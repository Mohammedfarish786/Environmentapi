const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: DataTypes.INTEGER,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    label: { type: DataTypes.STRING },
    status: { type: DataTypes.INTEGER, defaultValue: 1 },
    desc: { type: DataTypes.STRING },
    order: { type: DataTypes.INTEGER },
  },
  {
    tableName: "roles",
  },
);

module.exports = Role;
