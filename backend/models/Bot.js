const { Schema, ObjectId } = require("mongoose");
const connect = require("../databaseInitializer");

const Bot = new Schema({
  token: { type: String },
  telegramId: { type: String },
  firstName: { type: String },
  userName: { type: String },
  canJoinGroups: { type: Boolean },
  canReadAllGroupMessages: { type: Boolean },
  supportsInlineQueries: { type: Boolean },
  name: { type: String, required: true },
  isActive: { type: Boolean, required: true },
  userId: { type: ObjectId, required: true },
  createdDate: { type: Date, required: true },
});

module.exports = connect.model("Bot", Bot);
