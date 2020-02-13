const express = require("express");
const tournamentRouter = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { checkToken, asyncMiddleware, checkAdmin } = require("../middleware");
const { removeUserFromTournament, deleteTeam } = require("./methods");
const Tournament = require("../models/TournamentModel");
const User = require("../models/UserModel");
const Team = require("../models/TeamModel");

// Get all tournaments
// Public
tournamentRouter.get(
  "/",
  asyncMiddleware(async (req, res) => {
    const tournaments = await Tournament.find({}, null, {
      sort: "creationDate"
    });

    return res.json({ success: true, tournaments });
  })
);

// Create a new tournament
// Private
tournamentRouter.post(
  "/",
  checkToken,
  asyncMiddleware(async (req, res) => {
    const { title, passcode } = req.body;
    const user = await User.findById(req.user._id);

    if (!title || !passcode) {
      return next({
        status: 400,
        message: "Please, fill in all required information."
      });
    }

    // Save the new tournament
    const newTournament = await new Tournament({
      title,
      passcode,
      admin: req.user,
      // teamlessPlayers: [{ player: req.user._id }]
    }).save();

    // // Add the new tournament Id to the user
    // user.tournaments.push(newTournament._id);
    // user.save();

    res.status(201).json({
      success: true,
      tournament: newTournament
    });
  })
);

// Get tournaments by their state
// Public
tournamentRouter.get(
  "/state/:state",
  asyncMiddleware(async (req, res) => {
    const tournaments = await Tournament.find(
      {
        state: req.params.state.toUpperCase()
      },
      null,
      { sort: "creationDate" }
    );

    res.status(200).json({
      success: true,
      tournaments
    });
  })
);

// Joining a tournament as a User
// Private
tournamentRouter.put(
  "/join/:tournamentId",
  checkToken,
  asyncMiddleware(async (req, res, next) => {
    let tournament = await Tournament.findById(req.params.tournamentId);
    let user = await User.findById(req.user._id);
    if (!tournament) {
      return next({
        status: 404,
        message: "This tournaments does not exist."
      });
    }

    if (!tournament.state === "OPEN") {
      return next({
        status: 403,
        message: "The registration to this tournament it's already closed."
      });
    }

    const isInTournament =
      user.tournaments.some(tournmnt => {
        return tournmnt.equals(tournament._id);
      }) ||
      tournament.teamlessPlayers.some(teamlessPlayer => {
        return teamlessPlayer.player.equals(user._id);
      });
    if (isInTournament) {
      return next({
        status: 403,
        message: "You are already in this tournament."
      });
    }

    // Save user in tournament
    tournament.teamlessPlayers.push({ player: req.user._id });
    const updatedTournament = await tournament.save();

    // Save tournament Id in user
    user.tournaments.push(updatedTournament._id);
    await user.save();

    res.json({
      success: true,
      tournament: updatedTournament
    });
  })
);


tournamentRouter.put(
  "/joinwithteam/:tournamentId",
  checkToken,
  asyncMiddleware(async (req, res, next) => {
    const { tournamentId } = req.params
    const { teamName, teamAbbr, teamMateUsername } = req.body;
    let tournament = await Tournament.findById(tournamentId);
    let user = await User.findById(req.user._id);
    let teamMate = await User.findOne({ username: teamMateUsername });
    let teamsOnTournament = await Team.find({ tournament: tournamentId });
    console.log(teamsOnTournament)

    if (!teamName, !teamAbbr, !teamMateUsername) {
      return next({
        status: 400,
        message: "Please, fill in all required information."
      });
    }

    const teamAlreadyExist = teamsOnTournament.some(team => {
      return team.name.toUpperCase() == teamName.toUpperCase();
    })
    if (teamAlreadyExist) {
      return next({
        status: 403,
        message: "Sorry, this team name already exists."
      });
    }

    if (!teamMate) {
      return next({
        status: 404,
        message: "Your teammate username does not exist."
      });
    }

    const teamMateAlreadyInTeam = teamsOnTournament.some(team => {
      return team.players.some(player => {
        return player.equals(teamMate._id);
      })
    })
    if (teamMateAlreadyInTeam) {
      return next({
        status: 403,
        message: "Your teammate is already in a team."
      });
    }

    if (!tournament) {
      return next({
        status: 404,
        message: "This tournaments does not exist."
      });
    }

    if (!tournament.state === "OPEN") {
      return next({
        status: 403,
        message: "The registration to this tournament it's already closed."
      });
    }

    const isInTournament =
      user.tournaments.some(tournmnt => {
        return tournmnt.equals(tournament._id);
      })
    if (isInTournament) {
      return next({
        status: 403,
        message: "You are already in this tournament."
      });
    }

    // Create new Team
    const newTeam = await new Team({
      name: teamName,
      abbr: teamAbbr,
      tournament: tournamentId,
      players: [user._id, teamMate._id],
      admin: user._id
    }).save();

    // Save tournament Id in user
    user.tournaments.push(tournament._id);
    await user.save();
    // Save tournament Id in user
    teamMate.tournaments.push(tournament._id);
    await teamMate.save();

    const createdTeam = await newTeam.save();

    res.json({
      success: true,
      team: createdTeam
    });


  }))

// Start a tournament
// Private ADMIN
tournamentRouter.put(
  "/startTournament/:tournamentId",
  checkToken,
  checkAdmin,
  asyncMiddleware(async (req, res, next) => {
    const { tournamentId } = req.params;
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) {
      return next({
        status: 404,
        nessage: "This tournament does not exist."
      });
    }

    if (tournament.state != "OPEN") {
      return next({
        status: 403,
        nessage: "This tournament has already started."
      });
    }
    tournament.state = "ONGOING";

    // Delete tournament from users in teamlessPlayers
    tournament.teamlessPlayers.forEach(async player => {
      let user = await User.findById(player.player);
      var index = user.tournaments.indexOf(tournamentId);
      if (index > -1) {
        user.splice(index, 1);
      }
      await user.save();
    });

    // Delete remaining teamlessPlayers from tournament
    tournament.teamlessPlayers = [];
    const startedTournament = await tournament.save();
    res.json({
      success: true,
      tournament: startedTournament
    });
  })
);

// Leave a tournament
// Private
tournamentRouter.put(
  "/leave/:tournamentId",
  checkToken,
  asyncMiddleware(async (req, res, next) => {
    const { tournamentId } = req.params;
    const tournament = await Tournament.findById(req.params.tournamentId);
    const user = await User.findById(req.user._id);

    if (!tournament) {
      return next({
        status: 404,
        message: "This tournament does not exist."
      });
    }

    if (tournament.admin.equals(user._id)) {
      return next({
        status: 403,
        message: "You can't leave as you are the ADMIN of this tournament."
      });
    }

    const tournamentTeams = await Team.find({ tournament: tournamentId });
    const isInATeam = tournamentTeams.some(team => {
      return team.players.some(player => {
        return player.equals(user._id);
      });
    });
    if (isInATeam) {
      return next({
        status: 403,
        message: "You can't leave this tournament as you are already in a team."
      });
    }

    const isInThisTournament = tournament.teamlessPlayers.some(
      teamlessPlayer => {
        return teamlessPlayer.player.equals(user._id);
      }
    );
    if (!isInThisTournament) {
      return next({
        status: 403,
        message: "You are not part of this tournament."
      });
    }

    removeUserFromTournament(tournament, user);

    res.json({
      success: true,
      message: "You left the tournament successfully."
    });
  })
);

// Delete a tournament
// Pivate ADMIN
tournamentRouter.delete(
  "/delete/:tournamentId",
  checkToken,
  checkAdmin,
  asyncMiddleware(async (req, res, next) => {
    const { tournamentId } = req.params;
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      next({
        status: 404,
        message: "This tournament does not exist"
      });
    }

    if (tournament.state != "OPEN") {
      next({
        status: 403,
        message:
          "This tournament can't be deleted because it's either started or finished."
      });
    }

    let teams = await Team.find({ tournament: tournamentId });

    teams.forEach(team => {
      deleteTeam(team);
    });

    tournament.teamlessPlayers.forEach(async tlp => {
      let player = await User.findById(tlp.player);
      removeUserFromTournament(tournament, player);
    })

    const tournamentTitle = tournament.title;

    await tournament.deleteOne();

    res.json({
      success: true,
      message: `The tournament \"${tournamentTitle}\" has been deleted successfully.`
    });
  })
);

module.exports = tournamentRouter;
