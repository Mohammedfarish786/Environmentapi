const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Form = sequelize.define(
  "Form",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    form_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    form_fields: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },

    icon_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // 🔥 ADMIN gets notification
    admin_email_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // 🔥 USER gets confirmation
    user_email_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Form;
