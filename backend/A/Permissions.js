const DbPermissions = require("../models/Permissions");

class Permissions {
  constructor(bot) {
    this.bot = bot;
  }
  cteate = async (chatId, chatMember) => {
    if (!chatMember) return;
    const permission = new DbPermissions({
      chatId: chatId,
      botId: this.bot.id,
      status: chatMember.status,
      untilDate: chatMember.until_date,
      canBeEdited: chatMember.can_be_edited,
      canManageChat: chatMember.can_manage_chat,
      canChangeInfo: chatMember.can_change_info,
      canDeleteMessages: chatMember.can_delete_messages,
      canInviteUsers: chatMember.can_invite_users,
      canRestrictMembers: chatMember.can_restrict_members,
      canPinMessages: chatMember.can_pin_messages,
      canManageTopics: chatMember.can_manage_topics,
      canPromoteMembers: chatMember.can_promote_members,
      canManageVideoChats: chatMember.can_manage_video_chats,
      isAnonymous: chatMember.is_anonymous,
      customTitle: chatMember.custom_title,
      canPostMessages: chatMember.can_post_messages,
      canEditMessages: chatMember.can_edit_messages,
    });
    await permission.save();
    return permission;
  };
  update = async (chatId) => {
    const telegramBot = this.bot.getTelegramBot();
    let chatMember;
    try {
      chatMember = await telegramBot.getChatMember(chatId, this.bot.telegramId);
    } catch (error) {
      const dbPermissions = await DbPermissions.findOne({
        chatId,
        botId: this.bot.id,
      });
      if (!dbPermissions)
        return await new DbPermissions({
          chatId,
          botId: this.bot.id,
          status: "left",
        }).save();
      return await dbPermissions.replaceOne(
        { chatId: chatId },
        { chatId, botId: this.bot.id, status: "left" }
      );
    }
    return await this.change(chatId, chatMember);
  };

  change = async (chatId, chatMember) => {
    if (!chatMember) return;
    const permission = await DbPermissions.findOne({
      chatId: chatId,
      botId: this.bot.id,
    });
    if (!permission) return await this.cteate(chatId, chatMember);
    permission.status = chatMember.status;
    permission.untilDate = chatMember.until_date;
    permission.canBeEdited = chatMember.can_be_edited;
    permission.canManageChat = chatMember.can_manage_chat;
    permission.canChangeInfo = chatMember.can_change_info;
    permission.canDeleteMessages = chatMember.can_delete_messages;
    permission.canInviteUsers = chatMember.can_invite_users;
    permission.canRestrictMembers = chatMember.can_restrict_members;
    permission.canPinMessages = chatMember.can_pin_messages;
    permission.canManageTopics = chatMember.can_manage_topics;
    permission.canPromoteMembers = chatMember.can_promote_members;
    permission.canManageVideoChats = chatMember.can_manage_video_chats;
    permission.isAnonymous = chatMember.is_anonymous;
    permission.customTitle = chatMember.custom_title;
    permission.canPostMessages = chatMember.can_post_messages;
    permission.canEditMessages = chatMember.can_edit_messages;
    await permission.save();
    return permission;
  };

  check = async (chatId, permissionName) => {
    const permissions = await this.get(chatId);
    if (permissions.chatId > 0 && permissions.permissions == "member")
      return true;
    return permissions[permissionName];
  };
  get = async (chatId) => {
    let permissions = await DbPermissions.findOne({
      chatId: chatId,
      botId: this.bot.id,
    });
    if (permissions) return permissions;
    const telegramBot = this.bot.getTelegramBot();
    const chatMember = await telegramBot.getChatMember(
      chatId,
      this.bot.telegramId
    );
    if (!chatMember) {
      console.log("getChatMember in Permissions.get() return: " + chatMember);
      return;
    }
    permissions = await this.cteate(chatId, chatMember);
    return permissions;
  };
}

module.exports = Permissions;
