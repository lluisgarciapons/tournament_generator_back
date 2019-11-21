const express = require("express");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const User = require("../models/UserModel");

const createToken = (user, secret, expiresIn) => {
  console.log(user);
  const { _id, username, email } = user;
  return jwt.sign({ _id }, secret, { expiresIn });
};

authRouter.post("/signup", (req, res, next) => {
  console.log(req.body);
  if (
    !req.body.username ||
    !req.body.email ||
    !req.body.password ||
    !req.body.passwordValidation
  ) {
    return res.status(400).json({
      success: false,
      message: "Please, fill in all required information."
    });
  }
  if (req.body.password !== req.body.passwordValidation) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords must be equal." });
  }
  if (req.body.password < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long."
    });
  }

  User.findOne({ username: req.body.username }, (err, user) => {
    if (user) {
      return res
        .status(401)
        .json({ success: false, message: "This username already exists." });
    }

    User.findOne({ email: req.body.email }, (err, user) => {
      if (user) {
        return res
          .status(401)
          .json({ success: false, message: "This email already exists." });
      }
      new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
      })
        .save()
        .then(newUser => {
          console.log(newUser);
          res
            .status(201)
            .send({ token: createToken(newUser, keys.jwt.secret, "1hr") });
        });
    });
  });
});

module.exports = authRouter;
