const mongoose = require("mongoose");

const GameSchema = mongoose.Schema({
    gameTeams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "GameTeam"
    }],
    tournament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tournament"
    },
    round: {
        type: Number
    },
    game: {
        type: Number
    },
    state: {
        type: String,
        default: "EMPTY"
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GameTeam"
    },
    creationDate: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model("Game", GameSchema);
