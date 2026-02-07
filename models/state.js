const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const State = sequelize.define(
  "State",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    country_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "states",
    timestamps: false,
  },
);

module.exports = State;
