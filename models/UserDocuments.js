const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserDocuments = sequelize.define(
  "UserDocuments",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "UserDocuments",
    timestamps: false,
    underscored: true,
  },
);

module.exports = UserDocuments;
