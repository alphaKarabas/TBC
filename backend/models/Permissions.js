const { Schema, ObjectId } = require("mongoose");
const connect = require("../databaseInitializer")

const Permissions = new Schema({
  chatId: { type: String, required: true },
  botId: { type: ObjectId, required: true },
  status: { type: String, required: true  },
  untilDate: { type: Date },
  canBeEdited: { type: Boolean },
  isAnonymous: { type: Boolean },
  canManageChat: { type: Boolean },
  canDeleteMessages: { type: Boolean },
  canManageVideoChats: { type: Boolean },
  canRestrictMembers: { type: Boolean },
  canPromoteMembers: { type: Boolean },
  canChangeInfo: { type: Boolean },
  canInviteUsers: { type: Boolean },
  canPostMessages: { type: Boolean },
  canEditMessages: { type: Boolean },
  canPinMessages: { type: Boolean },
  canManageTopics: { type: Boolean },
  customTitle: { type: String },
});

module.exports = connect.model("Permissions", Permissions);
