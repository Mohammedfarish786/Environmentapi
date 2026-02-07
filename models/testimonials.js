const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Testimonial = sequelize.define(
  "Testimonial",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    location: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    rating: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },

    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  {
    tableName: "testimonials",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Testimonial;
