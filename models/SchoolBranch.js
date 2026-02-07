const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SchoolBranch = sequelize.define(
  "SchoolBranch",
  {
    school_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    school_branch_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    school_branch_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "school_branches",
  },
);

module.exports = SchoolBranch;
