const express = require("express");
const tournamentRouter = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const keys = require("../config/keys");
const { checkToken } = require("../middleware");
const Tournament = require("../models/TournamentModel");

tournamentRouter.get("/", (req, res) => {
  Tournament.find({}, (err, tournaments) => {
    return res.json(tournaments);
  });
});

tournamentRouter.post("/", checkToken, (req, res) => {
  const { title, passcode } = req.body;
  if (!title || !passcode) {
    return res.status(400).json({
      success: false,
      message: "Please, fill in all required information."
    });
  }
  new Tournament({
    title,
    passcode,
    admin: req.user,
    teamlessPlayers: [{ player: req.user }]
  })
    .save()
    .then(newTournament => {
      res.status(201).json(newTournament);
    })
    .catch(err => {
      res.status(400).json(err.errors);
    });
});

module.exports = tournamentRouter;
