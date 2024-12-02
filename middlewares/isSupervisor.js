const isSupervisor = (req, res, next) => {
  if (req.session?.userId && req.session?.user?.type === "supervisor") {
    return next();
  }

  res.redirect("/dashboard");
  // next();
};

module.exports.isSupervisor = isSupervisor;

