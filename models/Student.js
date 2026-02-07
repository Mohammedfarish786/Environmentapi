const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const Student = sequelize.define(
  "Student",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    student_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    institute_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // references: {
      //   model: 'Schools',
      //   key: 'id'
      // }
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // references: {
      //   model: 'Courses',
      //   key: 'id'
      // }
    },
    class_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "classes", // table name
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    roll_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    admission_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    parent_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parent_phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parent_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    date_of_birth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    blood_group: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "students",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Student;
