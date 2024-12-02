const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const routes = require("./routes/index");
const dashboardRoutes = require("./routes/dashboardRoutes");
const expressLayout = require("express-ejs-layouts");
const { isAdmin } = require("./middlewares/isAdmin");
const { isAuth } = require("./middlewares/isAuth");
const { sequelize } = require("./config/database");
const Question = require("./models/question");
const Test = require("./models/test");
const computerScienceQuestions = require("./constants/questions");
const http = require("http");
const { Server } = require("socket.io");
const { adminRoutes } = require("./routes/adminRoutes");
const SQLiteStore = require("connect-sqlite3")(session);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

app.use(expressLayout);
app.set("layout", "./layout/layout");
app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    store: new SQLiteStore({
      db: "sqlite.db", // SQLite database file name
      table: "sessions", // Table name for sessions
    }),
    secret: "your-secret-key",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
  })
);

app.use("/admin", isAdmin, adminRoutes);
app.use("/dashboard", isAuth, dashboardRoutes);
app.use("/", routes);

io.on("connection", socket => {
  console.log("A user connected", socket.request.session);

  socket.on("test-timer", async data => {
    const { testId, timeLeft, userId } = data;

    // find the test for the user and update the time left
    const test = await Test.findOne({ where: { id: testId, user_id: userId } });

    if (test && timeLeft !== null) {
      test.secondsLeft = timeLeft;
      test.save();
    }
    console.log("🚀 ~~ test:", test.dataValues.secondsLeft);
  });
});

const PORT = 3000;

// app.listen(PORT, () => console.log(`Client server running on port ${PORT}`));
const force = false;
sequelize.sync({ force }).then(async res => {
  const recentTest = await Test.findOne({ where: { id: 3, user_id: 1 } });

  // console.log("🚀 ~~ sequelize.sync ~~ questions:", questions);

  if (force) {
    await Question.bulkCreate(
      computerScienceQuestions.map((question, index) => ({
        ...question,
        id: index + 1,
        options: JSON.stringify(question.options),
      }))
    );
  }

  server.listen(PORT, () => console.log(`Client server running on port ${PORT}`));
});
