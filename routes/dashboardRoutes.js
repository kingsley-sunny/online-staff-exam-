const express = require("express");
const { Utils } = require("../utils/utils");
const { isSupervisor } = require("../middlewares/isSupervisor");
const User = require("../models/user");
const Test = require("../models/test");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { TEST_PASS_PERCENTAGE } = require("../constants/constant");
const router = express.Router();

router.get("/", async (req, res) => {
  const user = req.session.user;

  const testsTaken = await Test.count({ where: { user_id: user.id } });
  const testsPassed = await Test.count({
    where: {
      user_id: user.id,
      percentage: { [Op.gte]: TEST_PASS_PERCENTAGE },
      status: "completed",
    },
  });
  const testsFailed = await Test.count({
    where: { user_id: user.id, percentage: { [Op.lt]: TEST_PASS_PERCENTAGE }, status: "completed" },
  });

  const recentTests = await Test.findAll({
    where: { user_id: user.id },
    order: [["createdAt", "desc"]],
    limit: 5,
  });

  try {
    res.render("./dashboard/dashboard", {
      user,
      title: "Overview",
      layout: "./layout/dashboardLayout",
      testsTaken,
      testsPassed,
      testsFailed,
      recentTests,
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/tests/new", async (req, res) => {
  try {
    const user = req.session.user;

    // check if the user has active test
    const activeTest = await Test.findOne({
      where: { user_id: user.id, status: "active" },
      order: [["createdAt", "desc"]],
    });

    return res.render("./dashboard/test-info", {
      user: user,
      title: "Take a new test",
      layout: "./layout/dashboardLayout",
      activeTest,
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/tests/start-test", async (req, res) => {
  try {
    const user = req.session.user;
    await User.update({ screening_status: "in progress" }, { where: { id: user.id } });

    // check if the user has active test
    const activeTest = await Test.findOne({
      where: { user_id: user.id, status: "active" },
      order: [["createdAt", "desc"]],
    });

    if (activeTest) {
      return res.redirect(`/dashboard/tests/${activeTest.id}/${activeTest.current_no}`);
    }

    // const questions = Utils.getRandomItems(computerScienceQuestions);
    const [questions, metadata] = await sequelize.query(
      "SELECT * FROM questions ORDER BY RANDOM() LIMIT 10;"
    );

    const test = await Test.create({
      user_id: user.id,
      status: "active",
      title: "Staff Training Test",
      questions: JSON.stringify(questions?.map(q => ({ ...q, selected_no: null }))),
    });

    return res.redirect("/dashboard/tests/" + test.id + "/1");
  } catch (error) {
    console.log(error);
    res.render("error", {
      message: error.message,
      redirectUrl: "/tests/start-test",
      title: "Error",
      user: null,
    });
  }
});

router.post("/tests/submit", async (req, res) => {
  const user = req.session.user;
  const { id } = req.body;

  try {
    const test = await Test.findOne({ where: { id, user_id: user.id } });

    if (!test) {
      throw new Error("Test not found");
    }

    // end the test, calculate the score, percentage and update the test to completed
    test.status = "completed";
    test.score = Utils.calculateScore(JSON.parse(test.questions));
    test.percentage = Utils.calculatePercentage(test.score);

    await test.save();

    if (test.percentage >= TEST_PASS_PERCENTAGE) {
      await User.update({ screening_status: "success" }, { where: { id: user.id } });
      return res.render("test-success", {
        message: `You got ${test.score} out of 10. a total of ${test.percentage}%. Congrats!`,
        redirectUrl: "/dashboard",
        title: "Test - Passed",
        user: null,
      });
    } else {
      await User.update({ screening_status: "failed" }, { where: { id: user.id } });
      return res.render("test-failed", {
        message: `You got ${test.score} out of 10. a total of ${test.percentage}%.`,
        redirectUrl: "/dashboard",
        title: "Test - Failed",
        user: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.render("error", {
      message: error.message,
      redirectUrl: "/login",
      title: "Error",
      user: null,
    });
  }
});

router.post("/tests/question/submit", async (req, res) => {
  const user = req.session.user;
  const { answer, question_no, test_id } = req.body;

  try {
    const test = await Test.findOne({ where: { id: test_id, user_id: user.id } });
    if (!test) {
      throw new Error("Test not found");
    }

    const questions = JSON.parse(test.dataValues.questions);
    questions[question_no - 1].selected_no = answer;
    test.questions = JSON.stringify(questions);

    await test.save();

    res.redirect(`/dashboard/tests/${test_id}/${question_no}`);
  } catch (error) {
    console.log(error);
    res.render("error", {
      message: error.message,
      redirectUrl: "/login",
      title: "Error",
      user: null,
    });
  }
});

router.get("/tests/:id/:no", async (req, res) => {
  const user = req.session.user;
  const { id, no } = req.params;
  const next = no === 10 ? 1 : parseInt(no) + 1;
  const prev = no === 1 ? null : parseInt(no) - 1;

  try {
    const test = await Test.findOne({ where: { id, user_id: user.id } });
    if (!test) {
      throw new Error("Test not found");
    }

    test.current_no = no >= 10 ? 1 : parseInt(no) + 1;
    await test.save();

    let recentTest =
      (await Test.findOne({ where: { id, user_id: user.id, current_no: no } })) || test;
    const question = JSON.parse(recentTest?.dataValues?.questions)[no - 1];

    const secondsLeft = recentTest?.dataValues?.secondsLeft;

    return res.render("./dashboard/question", {
      user: user,
      title: "Question" + no,
      layout: "./layout/dashboardLayout",
      test: recentTest,
      next,
      prev,
      question,
      no,
      options: JSON.parse(question?.options),
      secondsLeft,
    });
  } catch (error) {
    console.log(error);
    res.render("error", {
      message: error.message,
      redirectUrl: "/login",
      title: "Error",
      user: null,
    });
  }
});

router.get("/tests", async (req, res) => {
  const user = req.session.user;
  const tests = await Test.findAll({
    where: { user_id: user.id },
    order: [["createdAt", "desc"]],
  });

  return res.render("./dashboard/tests", {
    user: user,
    title: "Seminars",
    layout: "./layout/dashboardLayout",
    tests,
  });
});

router.get("/", async (req, res) => {
  const user = req.session.user;
  const tests = await Test.findAll({
    where: { user_id: user.id },
    order: [["createdAt", "desc"]],
  });

  return res.render("./dashboard/tests", {
    user: user,
    title: "Seminars",
    layout: "./layout/dashboardLayout",
    tests,
  });
});

// router.get("/seminars/new", isSupervisor, async (req, res) => {
//   const user = req.session.user;

//   return res.render("./dashboard/new-seminar", {
//     user: user,
//     title: "Create a seminar topic",
//     layout: "./layout/dashboardLayout",
//   });
// });

// router.post("/seminars/new", isSupervisor, async (req, res) => {
//   try {
//     const user = req.session.user;
//     const { title, description } = req.body;

//     const seminar = await SeminarTopic.create({
//       title,
//       description,
//       user_id: user.id,
//     });

//     return res.redirect("/dashboard/seminars");
//   } catch (error) {
//     res.render("error", {
//       message: error.message,
//       redirectUrl: "/login",
//       title: "Error",
//       user: null,
//     });
//   }
// });

// router.post("/seminars/enroll", async (req, res) => {
//   try {
//     const user = req.session.user;
//     const { seminarId } = req.body;

//     // check if the seminar exists
//     const seminar = await SeminarTopic.findOne({
//       where: { id: seminarId },
//     });

//     if (!seminar) {
//       throw new Error("Seminar not found");
//     }

//     await UserSeminar.create({ user_id: user.id, seminar_id: seminarId });

//     return res.redirect("/dashboard/seminars/" + seminarId);
//   } catch (error) {
//     res.render("error", {
//       message: error.message,
//       redirectUrl: "/login",
//       title: "Error",
//       user: null,
//     });
//   }
// });

// router.get("/seminars/:id", async (req, res) => {
//   try {
//     const user = req.session.user;
//     const id = req.params.id;

//     const seminar = await SeminarTopic.findOne({
//       include: { foreignKey: "user_id", model: User },
//     });

//     const noOfStudents = await UserSeminar.count({
//       where: { seminar_id: id },
//     });

//     const userSeminar = await UserSeminar.findOne({
//       where: { user_id: user.id, seminar_id: id },
//     });

//     return res.render("./dashboard/seminar-details", {
//       user: user,
//       title: "Seminars",
//       layout: "./layout/dashboardLayout",
//       isEnrolled: !!userSeminar,
//       seminar,
//       noOfStudents,
//     });
//   } catch (error) {
//     res.render("error", {
//       message: error.message,
//       redirectUrl: "/login",
//       title: "Error",
//       user: null,
//     });
//   }
// });

// router.get("/my-seminars", async (req, res) => {
//   const user = req.session.user;
//   const seminars = await SeminarTopic.findAll({
//     order: [["createdAt", "desc"]],
//     where: { user_id: user.id },
//   });

//   return res.render("./dashboard/my-seminars", {
//     user: user,
//     title: "My Seminars",
//     layout: "./layout/dashboardLayout",
//     seminars,
//   });
// });

// router.get("/pickups", async (req, res) => {
//   try {
//     const user = req.session.user;
//     const totalPickups = await SeminarTopic.count();
//     const totalSuccessfulPickups = await SeminarTopic.count({ where: {} });
//     const totalFailedPickups = await SeminarTopic.count({ where: {} });
//     const totalPendingPickups = await SeminarTopic.count({ where: {} });

//     const pickups = await SeminarTopic.findAll({
//       order: [["date", "desc"]],
//     });

//     return res.render("./admin/pickups", {
//       user: user,
//       title: "Pickups",
//       layout: "./layout/adminLayout",
//       totalPickups,
//       totalFailedPickups,
//       totalSuccessfulPickups,
//       totalPendingPickups,
//       pickups,
//     }); // Fake stat
//   } catch (error) {
//     console.log(error);
//     // res.redirect("/login");
//   }
// });

// router.post("/pickups/update-status/:id", async (req, res) => {
//   try {
//     const id = req.params.id;

//     const pickup = await SeminarTopic.findByPk(id);

//     if (!pickup) {
//       throw new Error("Pickup Not Found");
//     }

//     // if(Utils.hasDateExpired(pickup.dataValues?.date)){
//     //   throw new Error("Pickup Has already been Expired")
//     // }

//     pickup.status = req.body.status;

//     await pickup.save();

//     res.redirect("/admin/pickups");
//   } catch (error) {
//     res.render("error", {
//       message: error.message,
//       redirectUrl: "/login",
//       title: "Error",
//       user: null,
//     });
//   }
// });

module.exports = router;
