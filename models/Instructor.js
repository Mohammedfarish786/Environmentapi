const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Instructor = sequelize.define(
  "Instructor",
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

    employee_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    institute_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // ===== Professional Info =====
    subject_specialization: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    qualification: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    experience_years: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    joining_date: {
      type: DataTypes.DATEONLY, // matches YYYY-MM-DD
      allowNull: true,
    },

    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // ===== Personal / Contact Info =====
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    pincode: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    alternate_phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    emergency_contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    emergency_contact_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    blood_group: {
      type: DataTypes.ENUM("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"),
      allowNull: true,
    },

    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: true,
    },

    marital_status: {
      type: DataTypes.ENUM("single", "married", "divorced", "widowed"),
      allowNull: true,
    },
  },
  {
    tableName: "instructors",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Instructor;
