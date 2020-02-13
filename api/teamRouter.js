const express = require("express");
const teamRouter = express.Router();
const { checkToken, asyncMiddleware, checkAdmin } = require("../middleware");
const { removeTeamLessPlayer, deleteTeam } = require("./methods");
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

teamRouter.get(
  "/find/:teamId",
  asyncMiddleware(async (req, res, next) => {
    const team = await Team.findById(req.params.teamId);
    res.json({
      success: true,
      team
    });
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

    const tournamentTeams = await Team.find({ tournament: tournamentId });
    const isInATeam = tournamentTeams.some(team => {
      return team.players.some(player => {
        return player.equals(user._id);
      });
    });
    if (isInATeam) {
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

    const isPlayerInTournament = tournament.teamlessPlayers.some(player => {
      // return player.player.equals(req.user._id);
      return player.player == req.user._id;
    });
    if (!isPlayerInTournament) {
      return next({
        status: 401,
        message: "You haven't joined this Tournament yet."
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
    await removeTeamLessPlayer(tournament, user);

    const createdTeam = await newTeam.save();

    res.json({
      success: true,
      team: createdTeam
    });
  })
);

// Join a team
// Private ADMIN
teamRouter.put(
  "/join/:teamId/:userId",
  checkToken,
  checkAdmin,
  asyncMiddleware(async (req, res, next) => {
    const { teamId, userId } = req.params;

    const user = await User.findById(userId).populate("teamPlayers");
    const team = await Team.findById(teamId);
    const tournament = await Tournament.findById(team.tournament);

    if (tournament.state != "OPEN") {
      return next({
        success: false,
        message:
          "You can't join the team because the tournament has already started."
      });
    }

    const tournamentTeams = await Team.find({ tournament: tournament._id });
    const isInATeam = tournamentTeams.some(team => {
      return team.players.some(player => {
        return player.equals(user._id);
      });
    });

    if (isInATeam) {
      return next({
        status: 403,
        message: "This user is already in a team."
      });
    }

    const isPlayerInTournament = tournament.teamlessPlayers.some(player => {
      return player.player.equals(user._id);
    });
    if (!isPlayerInTournament) {
      return next({
        status: 404,
        message: "This user does not belong to this tournament."
      });
    }

    if (team.players.length == 2) {
      return next({
        status: 403,
        message: "Your team is full."
      });
    }

    team.players.push(userId);
    let newTeam = await team.save();

    // delete TeamlessPlayer from list when creating a TeamPlayer
    removeTeamLessPlayer(tournament, user);

    res.json({
      success: true,
      team: newTeam
    });
  })
);

// Delete a team
// Private ADMIN
teamRouter.delete(
  "/delete/:teamId",
  checkToken,
  checkAdmin,
  asyncMiddleware(async (req, res, next) => {
    console.log("in");

    const { teamId } = req.params;
    const team = await Team.findById(teamId);
    const tournament = await Tournament.findById(team.tournament);

    if (tournament.state != "OPEN") {
      return next({
        status: 403,
        message:
          "The team can't be deleted because the tournament has already started."
      });
    }

    if (!team) {
      return next({
        status: 404,
        message: "This team doesn't exist."
      });
    }

    await deleteTeam(team);

    res.json({
      success: true,
      message: "Team deleted successfully."
    });
  })
);

// TODO create a delete Team that removes users from tournament

module.exports = teamRouter;