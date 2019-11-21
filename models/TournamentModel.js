const mongoose = require("mongoose");

const TournamentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 20,
    minlength: 3
  },
  passcode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30,
    minlength: 8
  },
  state: {
    type: String,
    default: "OPEN"
  },
  teamlessPlayers: {
    type: [
      {
        joinDate: {
          type: Date,
          default: Date.now()
        },
        player: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      }
    ]
  },
  games: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Game"
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team"
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  creationDate: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model("Tournament", TournamentSchema);
