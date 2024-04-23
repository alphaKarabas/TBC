const jwt = require("jsonwebtoken");
const config = require("config");
const User = require("../models/User");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {

    next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Auth error" });
    }

    const decoded = jwt.verify(token, config.get("secretJWTKey"));

    req.user = decoded;
    next();
  } catch (e) {

    return res.status(401).json({ message: "Auth error" });
  }
};
