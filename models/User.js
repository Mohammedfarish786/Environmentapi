const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mobileNo: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    avatar: {
      type: DataTypes.STRING,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 3,
    },
    institute_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    approval_status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "approved",
    },
    reset_otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_otp_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    otp_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    activation_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    activation_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

// // Hash password before saving
// User.beforeCreate(async (user) => {
//   const salt = await bcrypt.genSalt(10);
//   user.password = await bcrypt.hash(user.password, salt);
// });

// User.beforeUpdate(async (user) => {
//   if (user.changed('password')) {
//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(user.password, salt);
//   }
// });

module.exports = User;
