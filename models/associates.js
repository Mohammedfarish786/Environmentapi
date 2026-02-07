const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Associate = sequelize.define(
  "Associate",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    logo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  {
    tableName: "associates",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Associate;
