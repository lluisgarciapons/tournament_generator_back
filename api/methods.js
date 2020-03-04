const Tournament = require("../models/TournamentModel");
const User = require("../models/UserModel");
const Team = require("../models/TeamModel");
const Game = require("../models/GameModel")

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
  },

  isPowerOfTwo: numOfTeams => (numOfTeams & (numOfTeams - 1)) == 0,

  findPwr: (numOfTeams) => {
    let prevPwr, nextPwr;
    for (let i = 0; Math.pow(2, i) <= numOfTeams * 2; i++) {
      let pwr = Math.pow(2, i);
      if (pwr == numOfTeams) {
        prevPwr = pwr;
        nextPwr = pwr;
        break;
      }

      if (pwr > numOfTeams) {
        prevPwr = Math.pow(2, i - 1);
        nextPwr = pwr;
        break;
      }
    }

    return { prevPwr, nextPwr };
  },

  buildRounds: async (tournament) => {
    const teams = await Team.find({ tournament: tournament._id });
    const { prevPwr, nextPwr } = methods.findPwr(teams.length);
    let perfectTournamentTeams = teams.length;
    let round = 1;
    if (!methods.isPowerOfTwo(teams.length)) {
      let firstRoundGames = teams.length - prevPwr;
      for (let k = 1; k < firstRoundGames + 1; k++) {
        console.log(`create game: ${k}, round: ${round}`)
        let game = new Game({
          round,
          game: k,
          tournament: tournament._id
        })
        await game.save()
      }
      perfectTournamentTeams -= firstRoundGames;
      round++;
    }

    for (let i = perfectTournamentTeams; i > 1; i = (i / 2)) {
      for (let j = 1; j < (i / 2) + 1; j++) {
        console.log(`create game: ${j}, round: ${round}`)
        let game = new Game({
          round,
          game: j,
          tournament: tournament._id
        })
        await game.save()
      }
      round++;
    }
  }
};

module.exports = methods;