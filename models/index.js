const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Import models
const User = require("./User");
const Permission = require("./Permission");
const Role = require("./Role");
const RolePermission = require("./RolePermission");
const UserDocuments = require("./UserDocuments");
const Institute = require("./Institute");
const Instructor = require("./Instructor");
const Student = require("./Student");
const Class = require("./class");
const Map = require("./map");
const Icon = require("./icon");
const Form = require("./form");
const MapAssignment = require("./MapAssignments");

const Course = require("./course");
const CourseInstitute = require("./CourseInstitute");
const CourseContent = require("./courseContent");

// NEW MODELS
const Category = require("./category");
const Associate = require("./associates");
const Testimonial = require("./testimonials");
const Constant = require("./constants");
const Country = require("./country");
const State = require("./state");
const City = require("./city");
const EmailTemplate = require("./emailTemplate");

// ================= CLASS ↔ STUDENT =================
Class.hasMany(Student, {
  foreignKey: "class_id",
  as: "students",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Student.belongsTo(Class, {
  foreignKey: "class_id",
  as: "class",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// ================= COURSE ↔ INSTRUCTOR MAPPING =================
CourseInstitute.belongsTo(Instructor, {
  foreignKey: "instructor_id",
  as: "instructor",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Instructor.hasMany(CourseInstitute, {
  foreignKey: "instructor_id",
  as: "course_assignments",
});

// CourseInstitute → Class
CourseInstitute.belongsTo(Class, {
  foreignKey: "class_id",
  as: "class",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Class.hasOne(CourseInstitute, {
  foreignKey: "class_id",
  as: "course_assignment",
  onDelete: "CASCADE",
});

// ================= USER ↔ ROLE =================
User.belongsTo(Role, {
  foreignKey: { name: "roleId", allowNull: true },
  as: "role",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Role.hasMany(User, {
  foreignKey: { name: "roleId", allowNull: true },
  as: "users",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// ================= USER ↔ INSTITUTE =================
Institute.hasMany(User, {
  foreignKey: { name: "institute_id", allowNull: true },
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

User.belongsTo(Institute, {
  foreignKey: { name: "institute_id", allowNull: true },
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// ================= INSTRUCTOR =================
Institute.hasMany(Instructor, {
  foreignKey: "institute_id",
  as: "instructors",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Instructor.belongsTo(Institute, {
  foreignKey: "institute_id",
  as: "institute",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Instructor.belongsTo(User, {
  foreignKey: { name: "user_id", allowNull: true },
  as: "user",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

User.hasOne(Instructor, {
  foreignKey: { name: "user_id", allowNull: true },
  as: "instructor",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// // Class → User (teacher)
// Class.belongsTo(User, {
//   foreignKey: "class_instructor_id",
//   as: "teacher",
// });

// User.hasMany(Class, {
//   foreignKey: "class_instructor_id",
//   as: "teachingClasses",
// });

// ================= COURSE ↔ STUDENT =================
Course.hasMany(Student, {
  foreignKey: { name: "course_id", allowNull: true },
  as: "students",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Student.belongsTo(Course, {
  foreignKey: { name: "course_id", allowNull: true },
  as: "course",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// ================= COURSE ↔ INSTITUTE (MANY TO MANY) =================
Course.hasMany(CourseInstitute, {
  foreignKey: "course_id",
  as: "courseInstitutes",
  onDelete: "CASCADE",
  hooks: true,
});

CourseInstitute.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

Institute.hasMany(CourseInstitute, {
  foreignKey: "institute_id",
  as: "courseInstitutes",
  onDelete: "CASCADE",
  hooks: true,
});

CourseInstitute.belongsTo(Institute, {
  foreignKey: "institute_id",
  as: "institute",
});

Course.belongsToMany(Institute, {
  through: CourseInstitute,
  foreignKey: "course_id",
  otherKey: "institute_id",
  as: "institutes",
});

Institute.belongsToMany(Course, {
  through: CourseInstitute,
  foreignKey: "institute_id",
  otherKey: "course_id",
  as: "courses",
});

// ================= ICON ↔ FORM =================
Icon.hasOne(Form, { foreignKey: "icon_id" });
Form.belongsTo(Icon, { foreignKey: "icon_id" });

// ================= FORM ↔ EMAIL TEMPLATE =================
// Admin notification email
EmailTemplate.hasMany(Form, {
  foreignKey: "admin_email_id",
  as: "adminForms",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// User confirmation email
EmailTemplate.hasMany(Form, {
  foreignKey: "user_email_id",
  as: "userForms",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Form.belongsTo(EmailTemplate, {
  foreignKey: "admin_email_id",
  as: "adminEmailTemplate",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Form.belongsTo(EmailTemplate, {
  foreignKey: "user_email_id",
  as: "userEmailTemplate",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Institute.hasMany(Class, {
  foreignKey: "institute_id",
  as: "classes",
  onDelete: "CASCADE",
  hooks: true,
});

Class.belongsTo(Institute, {
  foreignKey: "institute_id",
  as: "institute",
  onDelete: "CASCADE",
});

// ================= USER ↔ STUDENT PROFILE =================
User.hasOne(Student, {
  foreignKey: "user_id",
  as: "studentProfile",
  onDelete: "CASCADE",
  hooks: true,
});

Student.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
  onDelete: "CASCADE",
});

// ================= ROLE ↔ PERMISSION =================
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "roleId",
  otherKey: "permissionId",
  as: "permissions",
  onDelete: "CASCADE",
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permissionId",
  otherKey: "roleId",
  as: "roles",
});
Permission.hasMany(RolePermission, {
  foreignKey: "permissionId",
  as: "rolePermissions",
});

RolePermission.belongsTo(Permission, {
  foreignKey: "permissionId",
  as: "permission", // 👈 define alias
});

// ================= COUNTRY → STATE → CITY =================
Country.hasMany(State, { foreignKey: "country_id" });
State.belongsTo(Country, { foreignKey: "country_id" });

State.hasMany(City, { foreignKey: "state_id" });
City.belongsTo(State, { foreignKey: "state_id" });

// ================= INSTITUTE REPRESENTATIVE =================
Institute.belongsTo(User, {
  foreignKey: "representative_id",
  as: "representative",
});

// ================= INSTITUTE ↔ STUDENT =================
Institute.hasMany(Student, {
  foreignKey: "institute_id",
  as: "students",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Student.belongsTo(Institute, {
  foreignKey: "institute_id",
  as: "institute",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

// ================= COURSE ↔ COURSE CONTENT =================
Course.hasMany(CourseContent, {
  foreignKey: "course_id",
  onDelete: "CASCADE",
  hooks: true,
});
CourseContent.belongsTo(Course, {
  foreignKey: "course_id",
});

// ================= EXPORT =================
module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  UserDocuments,
  Institute,
  Instructor,
  Student,
  Class,
  Map,
  Icon,
  Form,
  MapAssignment,
  Course,
  CourseInstitute,
  CourseContent,
  Category,
  Associate,
  Testimonial,
  Constant,
  Country,
  State,
  City,
  EmailTemplate,
};
