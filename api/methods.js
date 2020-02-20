const Tournament = require("../models/TournamentModel");
const User = require("../models/UserModel");
const Team = require("../models/TeamModel");

const methods = {
  deleteTeam: async team => {
    const tournament = await Tournament.findById(team.tournament);

    team.players.forEach(player => {
      tournament.teamlessPlayers.push({ player });
    });

    await tournament.save();

    await team.deleteOne();
  },

  deleteTeamDirectly: async team => {
    const tournament = await Tournament.findById(team.tournament);

    team.players.forEach(player => {
      const user = User.findById(player);
      const index = user.tournaments.indexOf(tournament._id);
      if (index > -1) {
        user.tournaments.splice(index, 1);
      }

      user.save()
    })

    await team.deleteOne();
  },

  removeTeamLessPlayer: async (tournament, user) => {
    const player = tournament.teamlessPlayers.find(tlp =>
      tlp.player.equals(user._id)
    );
    const i = tournament.teamlessPlayers.indexOf(player);
    if (i > -1) {
      tournament.teamlessPlayers.splice(i, 1);
      await tournament.save();
    }
  },

  removeUserFromTournament: async (tournament, user) => {
    const index = user.tournaments.indexOf(tournament._id);
    if (index > -1) {
      user.tournaments.splice(index, 1);
    }
    await user.save();

    // Delete remaining teamlessPlayers from tournament
    methods.removeTeamLessPlayer(tournament, user);
  }
};

module.exports = methods;