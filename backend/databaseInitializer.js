const mongoose = require("mongoose");
const config = require("config");

const connect = mongoose.createConnection(
  config.get("dbUrl"),
  () => console.log("mongoose START"),
  (e) => console.log("mongoose ERROR: " + e)
);

module.exports = connect