const express = require("express");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const keys = require("../config/keys");
const { checkToken } = require("../middleware");
const User = require("../models/UserModel");

const createToken = (user, secret, expiresIn) => {
  const { _id, username, email } = user;
  return jwt.sign({ _id }, secret, { expiresIn });
};

authRouter.post("/signup", (req, res, next) => {
  const { username, email, password, passwordValidation } = req.body;
  if (!username || !email || !password || !passwordValidation) {
    return res.status(400).json({
      success: false,
      message: "Please, fill in all required information."
    });
  }
  if (password !== passwordValidation) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords must be equal." });
  }
  if (password < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long."
    });
  }

  User.findOne({ username: username }, (err, user) => {
    if (user) {
      return res
        .status(401)
        .json({ success: false, message: "This username already exists." });
    }

    User.findOne({ email: email }, (err, user) => {
      if (user) {
        return res
          .status(401)
          .json({ success: false, message: "This email already exists." });
      }
      new User({
        username,
        email,
        password
      })
        .save()
        .then(newUser => {
          console.log(newUser);
          res
            .status(201)
            .send({ token: createToken(newUser, keys.jwt.secret, "1hr") });
        })
        .catch(err => {
          res.status(400).json(err.errors);
        });
    });
  });
});

authRouter.post("/login", (req, res, next) => {
  const { username, password } = req.body;
  User.findOne({ username }).then(user => {
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    bcrypt.compare(password, user.password).then(isValid => {
      if (!isValid) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid password." });
      }
      res
        .status(200)
        .send({ token: createToken(user, keys.jwt.secret, "1hr") });
    });
  });
});

authRouter.get("/currentUser", checkToken, (req, res, next) => {
  User.findById(req.user._id).then(user => {
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
    });
  });
});

module.exports = authRouter;
