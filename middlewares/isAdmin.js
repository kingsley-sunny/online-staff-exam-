const User = require("../models/user");

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.session.userId);
    if (user?.dataValues?.type !== "admin") {
    
      return res.render("error", {
        message: "You are not allowed to view this page",
        redirectUrl: "/login",
        title: "Error",
        user: null,
      });
    }

    return next();
  } catch (error) {
    res.render("error", {
      message: error.message,
      redirectUrl: "/login",
      title: "Error",
      user: null,
    });
  }
};

module.exports.isAdmin = isAdmin;
