const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Icon = sequelize.define(
  "Icon",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // references: {
      //   model: 'Users',
      //   key: 'id'
      // }
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Icon;
