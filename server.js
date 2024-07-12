const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const http = require("http");
const socketIo = require("socket.io");

require("./src/users/models/User");

const authRouter = require("./src/auth/auth.routes");
const notificationRouter = require("./src/notification/notification.routes");
const usersRouter = require("./src/users/users.routes");
const groupsRouter = require("./src/groups/group.routes");
const expenseRouter = require("./src/expenses/expense.routes");
const finverseRouter = require("./src/finverse/finverse.route");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    return res.send(200);
  } else {
    if (process.env.NODE_ENV != "test") {
      console.log(req.originalUrl);
    }
    return next();
  }
});

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json({ limit: "20mb" }));

const db = process.env.MONGO_URI;
if (process.env.NODE_ENV != "test") {
  mongoose
    .connect(db, { useNewUrlParser: true, useFindAndModify: false })
    .then(() => console.log("MongoDB successfully connected"))
    .catch((err) => console.log(err));
}

app.use(passport.initialize());

require("./src/config/passport")(passport);

app.use("/api/expenses", expenseRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/payment", finverseRouter);

const port = process.env.PORT || 5000;

server.listen(port, () => {
  if (process.env.NODE_ENV != "test") {
    console.log(`Server up and running on port ${port} !`);
  }
});

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.set('socketio', io);

module.exports = app;
