const express = require("express");
const Test = require("../models/test");
const Question = require("../models/question");
const User = require("../models/user");
const { Op } = require("sequelize");
const { TEST_PASS_PERCENTAGE } = require("../constants/constant");

const router = express.Router();

const layout = "./layout/adminLayout";

router.get("/", async (req, res) => {
  const user = req.session.user;
  try {
    const testsTaken = await Test.count({});
    const testsPassed = await Test.count({
      where: {
        percentage: { [Op.gte]: TEST_PASS_PERCENTAGE },
        status: "completed",
      },
    });
    const testsFailed = await Test.count({
      where: { percentage: { [Op.lt]: TEST_PASS_PERCENTAGE }, status: "completed" },
    });

    const totalQuestions = await Question.count();
    const totalUsers = await User.count();
    const totalScreenedUsers = await User.count({ where: { screening_status: "success" } });

    const recentTests = await Test.findAll({
      order: [["createdAt", "desc"]],
      limit: 20,
      include: User,
    });

    return res.render("./admin/admin", {
      user,
      title: "Admin - Dashboard",
      layout: "./layout/adminLayout",
      testsTaken,
      testsPassed,
      testsFailed,
      totalQuestions,
      totalUsers,
      totalScreenedUsers,
      recentTests,
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/tests", async (req, res) => {
  try {
    const user = req.session.user;
    const tests = await Test.findAll({
      order: [["createdAt", "desc"]],
      include: User,
    });

    res.render("./admin/tests", {
      user,
      title: "All Tests",
      layout: "./layout/adminLayout",
      tests,
    });
  } catch (error) {
    console.log(error);
    res.render("error", {
      message: error.message,
      redirectUrl: "/admin",
      title: "Error",
    });
  }
});

// add a route to get all the questions

router.get("/questions", async (req, res) => {
  try {
    const user = req.session.user;
    let questions = await Question.findAll({
      order: [["createdAt", "desc"]],
    });

    const formattedQuestions = questions.map(question => ({
      ...question.dataValues,
      options: JSON.parse(question.options),
    }));

    console.log("🚀 ~~ router.get ~~ questions:", formattedQuestions[0]);
    res.render("./admin/questions", {
      user,
      title: "All Questions",
      layout: "./layout/adminLayout",
      questions: formattedQuestions,
    });
  } catch (error) {
    console.log(error);
    res.render("error", {
      message: error.message,
      redirectUrl: "/admin",
      title: "Error",
    });
  }
});

router.get("/questions/new", async (req, res) => {
  try {
    const user = req.session.user;

    res.render("./admin/add-question", {
      user,
      title: "Add new Question",
      layout: "./layout/adminLayout",
    });
  } catch (error) {
    console.log(error);
    res.render("error", {
      message: error.message,
      redirectUrl: "/admin",
      title: "Error",
    });
  }
});

router.post("/questions/create", async (req, res) => {
  try {
    const user = req.session.user;
    const { title, options, correct_option_index } = req.body;

    const newQuestion = await Question.create({
      title,
      options,
      correct_option_index,
    });

    return res.json({
      message: "Successfully added question",
      success: true,
      question: newQuestion,
    });
  } catch (error) {
    console.log(error);
    return res.json({ message: error.message, success: false, error: true });
  }
});

module.exports.adminRoutes = router;
