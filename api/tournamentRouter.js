const express = require("express");
const tournamentRouter = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const keys = require("../config/keys");
const { checkToken, asyncMiddleware } = require("../middleware");
const Tournament = require("../models/TournamentModel");

tournamentRouter.get(
  "/",
  asyncMiddleware(async (req, res) => {
    const tournaments = await Tournament.find({});

    return res.json({ success: true, tournaments });
  })
);

tournamentRouter.post(
  "/",
  checkToken,
  asyncMiddleware(async (req, res) => {
    const { title, passcode } = req.body;
    if (!title || !passcode) {
      return next({
        status: 400,
        message: "Please, fill in all required information."
      });
    }

    const newTournament = await new Tournament({
      title,
      passcode,
      admin: req.user,
      teamlessPlayers: [{ player: req.user }]
    }).save();

    res.status(201).json({
      success: true,
      tournament: newTournament
    });
  })
);

tournamentRouter.get(
  "/state/:state",
  asyncMiddleware(async (req, res) => {
    const tournaments = await Tournament.find({
      state: req.params.state.toUpperCase()
    });

    res.status(200).json({
      success: true,
      tournaments
    });
  })
);

module.exports = tournamentRouter;
