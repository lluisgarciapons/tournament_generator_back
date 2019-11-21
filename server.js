const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const keys = require("./config/keys");
const authRouter = require("./api/authRouter");
const tournamentRouter = require("./api/tournamentRouter");

const app = express();

app.use(cors());

//init body-parses
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect(keys.mongodb.dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);

mongoose.connection.once("open", () => {
  console.log("Connected to database");
});

app.use("/auth", authRouter);
app.use("/tournament", tournamentRouter);

app.listen(5000, () => console.log("Now listening for requests on port 5000"));
