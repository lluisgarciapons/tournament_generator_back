const mongoose = require("mongoose");

const GameTeamSchema = mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Game"
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team"
  },
  creationDate: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model("GameTeam", GameTeamSchema);
