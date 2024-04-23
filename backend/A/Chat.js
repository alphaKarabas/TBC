const dbChat = require("../models/Chat");

class Chat {
  constructor(bot) {
    this.bot = bot;
  }
  cteate = async (chat) => {
    if (!chat) return;
    const dbchat = new dbChat({
      chatId: chat.id,
      type: chat.type,
      canSendMessages: chat.permissions?.can_send_messages,
      canSendMediaMessages: chat.permissions?.can_send_media_messages,
      canSendPolls: chat.permissions?.can_send_polls,
      canSendOtherMessages: chat.permissions?.can_send_other_messages,
      canAddWebPagePreviews: chat.permissions?.can_add_web_page_previews,
      canChangeInfo: chat.permissions?.can_change_info,
      canInviteUsers: chat.permissions?.can_invite_users,
      canPinMessages: chat.permissions?.can_pin_messages,
      canManageTopics: chat.permissions?.can_manage_topics,
    });
    await dbchat.save();
    return dbchat;
  };
  update = async (chatId) => {
    const telegramBot = this.bot.getTelegramBot();
    let chat;
    try {
      chat = await telegramBot.getChat(chatId);
    } catch (error) {
      const dbchat = await dbChat.findOne({
        chatId,
      });
      if (!dbchat) return await new dbChat({ chatId, type: "unknown" }).save();
      return await dbChat.replaceOne(
        { chatId: chatId },
        { chatId, type: dbchat.type }
      );
    }
    return await this.change(chat);
  };
  change = async (chat) => {
    if (!chat) return;
    const dbchat = await dbChat.findOne({
      chatId: chat.id,
    });
    if (!dbchat) return await this.cteate(chat);
    dbchat.type = chat.type;
    if (!chat.permissions) {
      await dbchat.save();
      return dbchat;
    }
    dbchat.canSendMessages = chat.permissions.can_send_messages;
    dbchat.canSendMediaMessages = chat.permissions.can_send_media_messages;
    dbchat.canSendPolls = chat.permissions.can_send_polls;
    dbchat.canSendOtherMessages = chat.permissions.can_send_other_messages;
    dbchat.canAddWebPagePreviews = chat.permissions.can_add_web_page_previews;
    dbchat.canChangeInfo = chat.permissions.can_change_info;
    dbchat.canInviteUsers = chat.permissions.can_invite_users;
    dbchat.canPinMessages = chat.permissions.can_pin_messages;
    dbchat.canManageTopics = chat.permissions.can_manage_topics;
    await dbchat.save();
    return dbchat;
  };
  check = async (chatId, permissionName) => {
    const dbchat = await this.get(chatId);
    if (dbchat.type == "private") return true;
    return dbchat[permissionName];
  };
  get = async (chatId) => {
    let dbchat = await dbChat.findOne({
      chatId: chatId,
    });
    if (dbchat) return dbchat;
    const telegramBot = this.bot.getTelegramBot();
    const chat = await telegramBot.getChat(chatId);
    if (!chat) {
      console.log("getChat in Chat.get() return: " + chat);
      return;
    }
    dbchat = await this.cteate(chat);
    return dbchat;
  };
}

module.exports = Chat;
