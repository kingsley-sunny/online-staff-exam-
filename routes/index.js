const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { isAuth } = require("../middlewares/isAuth");
const User = require("../models/user");
const { Op } = require("sequelize");

router.get("/", (req, res) => {
  const user = req.session?.user;

  if (user) {
    res.render("home", { title: "Home Page", user });
  }

  res.render("home", { title: "Home Page", user });
});

router.get("/login", (req, res) => res.render("login", { title: "Login", user: null }));

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { [Op.or]: [{ email }, { phone: email }] },
    });

    console.log(user.dataValues);

    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.userId = user.id;
      req.session.user = user;

      // await user.update({ type: "admin" });

      if (user.type === "admin") {
        return res.redirect("/admin");
      }

      res.redirect("/dashboard");
    } else {
      res.render("error", {
        message: "Invalid email, reg no or password.",
        redirectUrl: "/login",
        title: "Error",
        user: null,
      });
    }
  } catch (error) {
    res.render("error", {
      message: error.message,
      redirectUrl: "/login",
      title: "Error",
      user: null,
    });
  }
});

router.get("/register", (req, res) => res.render("register", { title: "Register", user: null }));

router.post("/register", async (req, res) => {
  try {
    const { full_name, phone, email, password } = req.body;

    const user = await User.findOne({
      where: {
        [Op.or]: [{ phone }, { email }],
      },
    });

    if (user) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({ full_name, phone, email, password: hashedPassword });

    res.render("success", {
      message: "Registration successful! You can now log in.",
      redirectUrl: "/login",
      title: "Success",
      user: null,
    });
  } catch (error) {
    res.render("error", {
      message: error.message,
      redirectUrl: "/register",
      title: "Error",
      user: null,
    });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// // schedule page
// router.get("/schedule", isAuth, (req, res) => {
//   const user = req.session?.user;

//   return res.render("schedule", { title: "Schedule a pickup", user });
// });

// router.post("/schedule", isAuth, async (req, res) => {
//   try {
//     const { lga, address, quantity, date } = req.body;
//     const pickup = await SeminarTopic.create({
//       lga,
//       address,
//       quantity,
//       date,
//       user_id: req.session?.userId,
//     });

//     return res.render("success", {
//       message: "Pickup successful, Expect us in a short while",
//       redirectUrl: "/pickups",
//       title: "Success",
//       user: req.session?.user,
//     });
//   } catch (error) {
//     res.render("error", {
//       message: error?.message,
//       redirectUrl: "/schedule",
//       title: "Error",
//       user: null,
//     });
//   }
// });

// router.get("/pickups", isAuth, async (req, res) => {
//   const user = req.session?.user;

//   const pickups = await SeminarTopic.findAll({
//     where: { user_id: user.id },
//     order: [["date", "desc"]],
//   });

//   return res.render("pickups", { title: "All pickups", user, pickups });
// });

// router.get("/logout", async (req, res) => {
//   req.session = null;

//   res.redirect("/login");
// });

// router.get("/dashboard", async (req, res) => {
//   if (req.session.userId) {
//     const user = await User.findByPk(req.session.userId);
//     const userCount = await User.count();

//     res.render("dashboard", { userCount, user: user }); // Fake stat
//   } else {
//     res.redirect("/login");
//   }
// });

// router.post("/api/login", async (req, res) => {
//   const { username, password } = req.body;
//   const user = await User.findOne({ where: { [Op.or]: [{ username }, { email: username }] } });
//   if (user && (await bcrypt.compare(password, user.password))) {
//     res.json({ success: true });
//   } else {
//     res.json({ success: false });
//   }
// });

router.get("/x", (req, res) => res.render("x", { title: "Sample", user: null }));

module.exports = router;
