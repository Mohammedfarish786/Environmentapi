const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const EmailTemplate = sequelize.define(
  "EmailTemplate",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    template_html: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
  },
  {
    tableName: "emailtemplate",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = EmailTemplate;
