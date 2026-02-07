const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Institute = sequelize.define(
  "Institute",
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

    institute_type: {                        // NEW
      type: DataTypes.STRING,
      allowNull: false,
    },

    institute_board_university: {            // NEW
      type: DataTypes.STRING,
      allowNull: true,
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    institute_city: {                        // NEW
      type: DataTypes.STRING,
      allowNull: false,
    },

    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    pincode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    alternate_phone: {                       // NEW
      type: DataTypes.STRING,
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    institute_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    institute_logo: {                        // NEW
      type: DataTypes.STRING, // store file path or URL
      allowNull: true,
    },

    representative_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    is_active: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    approvedstatus: {
      type: DataTypes.ENUM("approved", "rejected", "pending"),
      defaultValue: "approved",
    },
  },

  {
    tableName: "institutes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Institute;
