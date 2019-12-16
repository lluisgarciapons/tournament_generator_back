const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 20,
    minlength: 3
  },
  abbr: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3,
    minlength: 3
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament"
  },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // teamPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: "TeamPlayer" }],

  // gameTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: "GameTeam" }],

  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  creationDate: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model("Team", TeamSchema);
