const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const City = sequelize.define(
  "City",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    state_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "cities",
    timestamps: false,
  },
);

module.exports = City;
