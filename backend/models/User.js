const { Schema } = require("mongoose");
const connect = require("../databaseInitializer")

const User = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  telegramId: { type: Number },
  authKey: { type: String },
  accountType: {
    name: { type: String, required: true },
    createdDate: { type: Date, required: true },
    TerminationDate: { type: Date },
  },
});

module.exports = connect.model("User", User);