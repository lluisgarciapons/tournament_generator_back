const express = require("express");
const teamRouter = express.Router();
const { checkToken, asyncMiddleware } = require("../middleware");
const Team = require("../models/TeamModel");
const Tournament = require("../models/TournamentModel");

teamRouter.get(
  "/",
  asyncMiddleware(async (req, res, next) => {
    const teams = Team.find({});

    res.status(200).json({ success: true, teams });
  })
);

teamRouter.post(
  "/create/:tournamentId",
  checkToken,
  asyncMiddleware(async (req, res) => {
    const { tournamentId } = req.params;
    const tournament = await Tournament.findById(tournamentId);
  })
);

module.exports = teamRouter;
