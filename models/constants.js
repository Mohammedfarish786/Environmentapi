const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Constant = sequelize.define(
  "Constant",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    tableName: "constants",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Constant;
