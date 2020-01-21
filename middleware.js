let jwt = require("jsonwebtoken");
const Tournament = require("./models/TournamentModel");
const Team = require("./models/TeamModel");

let checkToken = (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"]; // Express headers are auto converted to lowercase
  if (token && token.startsWith("Bearer ")) {
    // Remove Bearer from string
    token = token.slice(7, token.length);
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Auth token is not supplied"
    });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid"
      });
    } else {
      req.user = decoded;
      // console.log(decoded);
      next();
    }
  });
};

let checkAdmin = async (req, res, next) => {
  const { tournamentId, teamId } = req.params;
  const model = tournamentId ? Tournament : Team;
  const id = tournamentId ? tournamentId : teamId;

  const event = await model.findById(id);
  console.log(event);

  if (event.admin != req.user._id) {
    return next({
      status: 401,
      message: "You are not authorized to modify this event"
    });
  }
  return next();
};

errorHandler = function (err, req, res, next) {
  // console.error(err.stack);
  console.error(err);
  res.status(err.status || 400).send({
    success: false,
    message: err._message || err.message
  });
};

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  checkToken,
  checkAdmin,
  errorHandler,
  asyncMiddleware
};