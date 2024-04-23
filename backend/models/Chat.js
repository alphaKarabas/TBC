const { Schema, ObjectId } = require("mongoose");
const connect = require("../databaseInitializer")

const Chat = new Schema({
  chatId: { type: String, required: true, unique: true },
  type:{ type: String, required: true  },
  canSendMessages: { type: Boolean },
  canSendMediaMessages: { type: Boolean },
  canSendPolls: { type: Boolean },
  canSendOtherMessages: { type: Boolean },
  canAddWebPagePreviews: { type: Boolean },
  canChangeInfo: { type: Boolean },
  canInviteUsers: { type: Boolean },
  canPinMessages: { type: Boolean },
  canManageTopics: { type: Boolean },
});

module.exports = connect.model("Chat", Chat);

