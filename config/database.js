const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./db/sqlite.db",
  
});

module.exports = { sequelize };
