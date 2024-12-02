const isAuth = (req, res, next) => {
  if (req.session?.userId && req.session?.user) {
    return next();
  }

  res.redirect("/login");
  // next();
};

module.exports.isAuth = isAuth;
