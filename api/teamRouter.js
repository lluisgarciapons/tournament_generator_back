const express = require("express");
const teamRouter = express.Router();
const { checkToken, asyncMiddleware, checkAdmin } = require("../middleware");
const { removeTeamLessPlayer } = require("./methods");
const Team = require("../models/TeamModel");
const Tournament = require("../models/TournamentModel");
const User = require("../models/UserModel");
// const TeamPlayer = require("../models/TeamPlayerModel");

// Get all teams
// Public
teamRouter.get(
  "/",
  asyncMiddleware(async (req, res, next) => {
    const teams = await Team.find({});

    res.json({ success: true, teams });
  })
);

// Create a team for an specific tournament
// Private
teamRouter.post(
  "/create/:tournamentId",
  checkToken,
  asyncMiddleware(async (req, res, next) => {
    const { tournamentId } = req.params;
    const { name, abbr } = req.body;
    const tournament = await Tournament.findById(tournamentId);
    const user = await User.findById(req.user._id);

    const isPlayerInTournament = tournament.teamlessPlayers.some(player => {
      return player.player == req.user._id;
    });
    if (!isPlayerInTournament) {
      return next({
        status: 401,
        message: "You haven't joined this Tournament yet."
      });
    }

    const isPlayerInATeam = user.teamPlayers.some(teamPlayer => {
      return teamPlayer.team.tournament == tournamentId;
    });
    if (isPlayerInATeam) {
      return next({
        status: 403,
        message: "You are already in a team."
      });
    }

    if (!name || !abbr) {
      return next({
        status: 400,
        message: "Please, fill in the missing information."
      });
    }

    // Create new Team
    const newTeam = await new Team({
      name,
      abbr,
      tournament: tournamentId,
      players: [user._id],
      admin: user._id
    }).save();

    // delete TeamlessPlayer from list when creating a TeamPlayer
    var index = tournament.teamlessPlayers.indexOf(user._id);
    if (index > -1) {
      tournament.teamlessPlayers.splice(index, 1);
    }

    tournament.save();
    user.save();
    const createdTeam = await newTeam.save();

    res.json({
      success: true,
      team: createdTeam
    });
  })
);

// Join a team
// Private ADMIN
teamRouter.put("/join/:teamId/:userId"),
  checkToken,
  checkAdmin,
  asyncMiddleware(async (req, res, next) => {
    const { teamId, userId } = req.params;

    const user = await User.findById(userId).populate("teamPlayers");
    const team = await Team.findById(teamId);
    const tournament = await Tournament.findById(team.tournament);

    const isAlreadyInATeam = await Team.find({ players: user._id });

    if (isAlreadyInATeam) {
      next({
        status: 403,
        message: "This user is already in a team."
      });
    }

    if (!tournament.teamlessPlayers.includes(userId)) {
      next({
        status: 404,
        message: "This user does not belong to this tournament."
      });
    }

    if (Team.players.length == 2) {
      next({
        status: 403,
        message: "Your team is full."
      });
    }

    Team.players.push(userId);
    let newTeam = await Team.save();

    // delete TeamlessPlayer from list when creating a TeamPlayer
    removeTeamLessPlayer(tournament, user);

    res.json({
      success: true,
      team: newTeam
    });
  });

module.exports = teamRouter;
