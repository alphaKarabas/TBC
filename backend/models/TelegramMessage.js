const { Schema, ObjectId } = require("mongoose");
const connect = require("../databaseInitializer");

const TelegramMessage = new Schema({
  botId: { type: ObjectId, required: true },
  isBot: { type: Boolean, required: true },
  chat_id: { type: String, required: true },
  message_id: { type: String, required: true },
  nodeId: { type: ObjectId },
  moduleId: { type: String },
  sentDate: { type: Date, required: true },
  data: { type: Object, required: true },
});

module.exports = connect.model("TelegramMessage", TelegramMessage);
