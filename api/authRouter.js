const express = require("express");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// const keys = require("../config/keys");
const { checkToken, asyncMiddleware } = require("../middleware");
const User = require("../models/UserModel");
const Team = require("../models/TeamModel")

const createToken = (user, secret, expiresIn) => {
  const { _id } = user;
  return jwt.sign({ _id }, secret, { expiresIn });
};

authRouter.post(
  "/signup",
  asyncMiddleware(async (req, res, next) => {
    const { username, email, password, passwordValidation } = req.body;
    if (!username || !email || !password || !passwordValidation) {
      return next({
        status: 400,
        message: "Please, fill in all required information."
      });
    }
    if (password !== passwordValidation) {
      return next({
        status: 400,
        message: "Passwords must be equal."
      });
    }
    if (password < 6) {
      return next({
        status: 400,
        message: "Password must be at least 6 characters long."
      });
    }

    const userByName = await User.findOne({ username: username });
    if (userByName) {
      return next({
        status: 403,
        message: "This username already exists."
      });
    }

    const userByEmail = await User.findOne({ email: email });
    if (userByEmail) {
      return next({
        status: 403,
        message: "This email is already in use."
      });
    }
    const newUser = await new User({
      username,
      email,
      password
    }).save();
    console.log(newUser);
    res.status(201).send({
      success: true,
      token: createToken(newUser, process.env.JWT_SECRET, "24h")
    });
  })
);

authRouter.post(
  "/login",
  asyncMiddleware(async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return next({
        status: 400,
        message: "Please, fill in all required information."
      });
    }
    const user = await User.findOne({ username });

    if (!user) {
      next({
        status: 404,
        message: "User not found."
      });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return next({
        status: 400,
        message: "Invalid password."
      });
    }
    res.status(200).json({
      success: true,
      token: createToken(user, process.env.JWT_SECRET, "24h")
    });
  })
);

authRouter.get(
  "/currentUser",
  checkToken,
  asyncMiddleware(async (req, res, next) => {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("tournaments", "-passcode")

    if (!user) {
      return next({
        status: 404,
        message: "User not found."
      });
    }
    console.log(user);
    res.status(200).json({
      success: true,
      user
    });
  })
);

module.exports = authRouter;
