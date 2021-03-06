const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

require("dotenv").config()
const { checkToken, errorHandler } = require("./middleware");
const authRouter = require("./api/authRouter");
const tournamentRouter = require("./api/tournamentRouter");
const teamRouter = require("./api/teamRouter");

const app = express();

app.use(cors());

//init body-parses
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).catch(err => {
  console.log(err)
})
mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);

mongoose.connection.once("open", () => {
  console.log("Connected to database");
});

app.use("/auth", authRouter);
app.use("/tournaments", tournamentRouter);
app.use("/teams", teamRouter);

app.use(errorHandler);

app.listen(process.env.PORT || 5000, () => console.log("Now listening for requests on port 5000"));
