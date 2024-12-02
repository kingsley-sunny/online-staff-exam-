const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const LoginSession = sequelize.define(
  "login_sessions",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

module.exports = LoginSession;
