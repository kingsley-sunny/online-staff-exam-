const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require("./user");

const Test = sequelize.define(
  "tests",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    questions: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    percentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    current_no: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    secondsLeft: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5 * 60,
    },
    status: {
      type: DataTypes.ENUM("active", "completed"),
      allowNull: false,
      defaultValue: "active",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

User.hasMany(Test, { foreignKey: "user_id" });
Test.belongsTo(User, { foreignKey: "user_id" });

module.exports = Test;
