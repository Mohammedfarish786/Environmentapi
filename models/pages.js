const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pages = sequelize.define(
  "Pages",
  {
    id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    route: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    meta_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    meta_desc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    meta: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    content: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("draft", "published"),
      defaultValue: "draft",
    },
  },
  {
    tableName: "pages",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
);

module.exports = Pages;
