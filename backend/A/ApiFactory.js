const Client = require("./Client");
const TelegramMessage = require("../models/TelegramMessage");
const { BOT_SENDERS } = require("./constants");

class ApiFactory {
  constructor(node, bot) {
    this.bot = bot;
    this.node = node;
  }

  getSenders = (bot, node) => {
    const telegramBot = bot.getTelegramBot();
    const senders = {};
    BOT_SENDERS.forEach((sender) => {
      const bindedSender = telegramBot[sender].bind(telegramBot);
      senders[sender] = new Proxy(bindedSender, {
        async apply(target, thisArg, args) {
          let msg = {};
          try {
            const canSendMessages = await checkPermissions(
              args[0],
              bot,
              "canSendMessages"
            );
            if (!canSendMessages)
              return {
                ok: false,
                error_code: 400,
                description: `Bad Request: have no rights to send a "${sender}"`,
              };
            msg = await target.apply(thisArg, args);
          } catch (error) {
            console.log(
              `ERROR: Error when trying to send a "${sender}" with args:`
            );
            console.log(args);
            console.log(error?.response?.body);
            if (args[0] > 0 && error?.response?.body)
              await Client.block(args[0], bot.id);
            else {
              bot.permissions.update(args[0]);
              bot.chat.update(args[0]);
            }
            return error?.response?.body || { ok: false };
          }
          const msgError =
            msg &&
            Object.keys(msg).length === 0 &&
            Object.getPrototypeOf(msg) === Object.prototype;
          if (msgError) return;
          saveBotMessage(msg, bot, node);
          msg.ok = true;
          return msg;
        },
      });
    });
    senders["sendCopy"] = async (chatId, message) => {
      if (!chatId || !message) return;
      const telegramBot = bot.getTelegramBot();
      let sendedMessage;
      try {
        sendedMessage = await sendCopyOfMessage(
          telegramBot,
          chatId,
          message,
          bot
        );
      } catch (error) {
        console.log(`ERROR: Error when trying to send copy message with args:`);
        console.log(chatId);
        console.log(error?.response?.body);
        if (chatId > 0 && error?.response?.body)
          await Client.block(chatId, bot.id);
        else {
          bot.permissions.update(chatId);
          bot.chat.update(chatId);
        }
        return error?.response?.body || { ok: false };
      }
      if (!sendedMessage?.message_id) return { ok: false };
      if (!message.message_id) {
        saveBotMessage(sendedMessage, this.bot, {});
        sendedMessage.ok = true;
        return sendedMessage;
      }
      try {
        const telegramMessage = await TelegramMessage.findOne({
          chat_id: message.chat.id,
          message_id: message.message_id,
          botId: this.bot.getId(),
        });

        const node = {
          _id: telegramMessage?.nodeId,
          moduleId: telegramMessage?.moduleId,
        };

        saveBotMessage(sendedMessage, this.bot, node);
      } catch (error) {
        console.log(
          `ERROR: CRIYICAL Error when trying to send copy message with args:`
        );
        console.log(chatId, message);
        console.log(error);
        return { ok: false };
      }
      sendedMessage.ok = true;
      return sendedMessage;
    };
    return senders;
  };

  getEditMessageText = (bot) => {
    const telegramBot = bot.getTelegramBot();
    const bindedSender = telegramBot["editMessageText"].bind(telegramBot);
    return new Proxy(bindedSender, {
      async apply(target, thisArg, args) {
        let messageInfo = {};
        try {
          const canSendMessages = await checkPermissions(
            args[1].chat_id,
            bot,
            "canSendMessages"
          );
          if (!canSendMessages)
            return {
              ok: false,
              error_code: 400,
              description: "Bad Request: have no rights to send a message",
            };
          messageInfo = await target.apply(thisArg, args);
        } catch (error) {
          console.log(`ERROR: Error when trying to check a permissions with args:`);
          console.log(args);
          console.log(error?.response?.body);
        }
        try {
          await editBotMessage(messageInfo, args, bot);
        } catch (error) {
          console.log(`ERROR: Error when trying to edit a message with data:`);
          console.log(messageInfo);
          console.log(error?.response?.body);
        }
        messageInfo.ok = true;
        return messageInfo;
      },
    });
  };

  getDeleteMessage = (bot) => {
    const telegramBot = bot.getTelegramBot();
    const bindedSender = telegramBot["deleteMessage"].bind(telegramBot);

    return new Proxy(bindedSender, {
      async apply(target, thisArg, args) {
        const chatId = args[0];
        const messageId = args[1];
        let messageInfo = {};
        try {
          messageInfo = await target.apply(thisArg, args);
        } catch (error) {
          console.log(
            `ERROR: Error when trying to delete a message with args:`
          );
          console.log(args);
          console.log(error?.response?.body);
        }
        try {
          await TelegramMessage.deleteOne({
            chat_id: chatId,
            message_id: messageId,
            botId: bot.getId(),
          });
        } catch (error) {
          console.log(
            `ERROR: Error when trying to delete a message in DB with data:`
          );
          console.log(messageInfo);
          console.log(error?.response?.body);
        }
        return messageInfo;
      },
    });
  };

  getEditMessageReplyMarkup = (bot) => {
    const telegramBot = bot.getTelegramBot();
    return telegramBot["editMessageReplyMarkup"].bind(telegramBot);
  };

  createUniversalApi = async () => {
    const api = {
      myChats: this.bot.myChats,
      replaceMessage: (chatId, messageId, message) =>
        replaceMessage(this.bot.TelegramBot, chatId, messageId, message),
      getChat: async (chatId) => await this.bot.TelegramBot.getChat(chatId),
      unpinChatMessage: async (chatId, messageId) =>
        await this.bot.TelegramBot.unpinChatMessage(chatId, messageId),
      unpinAllChatMessages: async (chatId) =>
        await this.bot.TelegramBot.unpinAllChatMessages(chatId),
      botOwner: await this.bot.getUserTelegramId(),
      editMessageText: await this.getEditMessageText(this.bot),
      deleteMessage: await this.getDeleteMessage(this.bot),
      editMessageReplyMarkup: await this.getEditMessageReplyMarkup(this.bot),
      node: this.node.data,
      id: this.node._id + "",
      botId: this.bot.id + "",
      ...this.getSenders(this.bot, this.node),
    };
    return api;
  };
}

const checkPermissions = async (chatId, bot, permissionName) => {
  if (!chatId || !bot || !permissionName) return false;
  if (chatId == "1087968824") return false;
  if (chatId > 0) {
    const botIsBlocked = await Client.isBlocked(chatId, bot.id);
    return !botIsBlocked;
  }
  const status = await bot.permissions.check(chatId, "status");
  if (status == "member") {
    let permission = await bot.chat.check(chatId, permissionName);
    if (!permission) await bot.chat.update(chatId);
    permission = await bot.chat.check(chatId, permissionName);
    return permission;
  } else if (status == "administrator") {
    if (
      permissionName == "canSendMessages" ||
      permissionName == "canSendMediaMessages" ||
      permissionName == "canSendPolls" ||
      permissionName == "canSendOtherMessages" ||
      permissionName == "canAddWebPagePreviews"
    )
      return true;
    else {
      let permission = await bot.permissions.check(chatId, permissionName);
      return permission;
    }
  } else if (status == "creator") {
    return true;
  } else {
    let permission = await bot.permissions.update(chatId, permissionName);
    return permission;
  }
};

const editBotMessage = async (data, args, bot) => {
  const chatId = args[1].chat_id;
  const messageId = args[1].message_id;
  const telegramMessage = await TelegramMessage.findOne({
    chat_id: chatId,
    message_id: messageId,
    botId: bot.getId(),
  });
  telegramMessage.data = data;
  await telegramMessage.save();
  return telegramMessage;
};


const saveBotMessage = (msg, bot, node) => {
  const telegramMessage = new TelegramMessage({
    botId: bot.getId(),
    isBot: true,
    chat_id: msg.chat.id,
    message_id: msg.message_id,
    nodeId: node._id,
    moduleId: node.moduleId,
    sentDate: new Date(),
    data: msg,
  });
  telegramMessage.save();
  return telegramMessage;
};

const replaceMessage = async (telegramBot, chatId, messageId, message) => {
  const reply =
    message.chat?.id != chatId
      ? {}
      : {
          reply_to_message_id: message.reply_to_message?.message_id
        };
  if (message.text) {
    reply.chat_id = chatId;
    reply.message_id = messageId;
    reply.reply_markup = message.reply_markup
    try {
      const seditedMessage = await telegramBot.editMessageText(
        message.text,
        reply
      );
      seditedMessage.ok = true;
      return seditedMessage;
    } catch (error) {
      console.log(`ERROR: Error when trying to replace a message with data:`);
      console.log(chatId, messageId, message);
      console.log(error.response?.body);
      return { ok: false };
    }
  } else if (message.sticker) {
    reply.chat_id = chatId;
    reply.message_id = messageId;
    try {
      const seditedMessage = await telegramBot.editMessageText(
        message.sticker.file_id,
        reply
      );
      seditedMessage.ok = true;
      return seditedMessage;
    } catch (error) {
      console.log(`ERROR: Error when trying to replace a message with data:`);
      console.log(chatId, messageId, message);
      console.log(error.response?.body);
      return { ok: false };
    }
  } else if (message.photo) {
    reply.chat_id = chatId;
    reply.message_id = messageId;
    reply.caption = message.caption;
    const photoId = message.photo[message.photo.length - 1].file_id;
    try {
      const seditedMessage = await telegramBot.editMessageMedia(
        { type: "photo", media: photoId },
        reply
      );
      seditedMessage.ok = true;
      return seditedMessage;
    } catch (error) {
      console.log(`ERROR: Error when trying to replace a message with data:`);
      console.log(chatId, messageId, message);
      console.log(error.response?.body);
      return { ok: false };
    }
  } else if (message.document) {
    reply.chat_id = chatId;
    reply.message_id = messageId;
    reply.caption = message.caption;
    const documentId = message.document.file_id;
    try {
      const seditedMessage = await telegramBot.editMessageMedia(
        { type: "document", media: documentId },
        reply
      );
      seditedMessage.ok = true;
      return seditedMessage;
    } catch (error) {
      console.log(`ERROR: Error when trying to replace a message with data:`);
      console.log(chatId, messageId, message);
      console.log(error.response?.body);
      return { ok: false };
    }
  }
};

const sendCopyOfMessage = async (telegramBot, chatId, message, bot) => {
  if (message.text) {
    if (!(await checkPermissions(chatId, bot, "canSendMessages")))
      return { ok: false };
    const reply = {
      reply_markup: message.reply_markup,
    };
    if (message.chat?.id == chatId)
      reply.reply_to_message_id = message.reply_to_message?.message_id;
    return await telegramBot.sendMessage(chatId, message.text, reply);
  } else if (message.sticker) {
    if (!(await checkPermissions(chatId, bot, "canSendMessages")))
      return { ok: false };
    const reply = {
      reply_markup: message.reply_markup,
    };
    if (message.chat?.id == chatId)
      reply.reply_to_message_id = message.reply_to_message?.message_id;
    return await telegramBot.sendSticker(
      chatId,
      message.sticker.file_id,
      reply
    );
  } else if (message.photo) {
    if (!(await checkPermissions(chatId, bot, "canSendMessages")))
      return { ok: false };
    const reply = {
      reply_markup: message.reply_markup,
      caption: message.caption,
    };
    if (message.chat?.id == chatId)
      reply.reply_to_message_id = message.reply_to_message?.message_id;
    return await telegramBot.sendPhoto(
      chatId,
      message.photo[message.photo.length - 1].file_id,
      reply
    );
  } else if (message.document) {
    if (!(await checkPermissions(chatId, bot, "canSendMessages")))
      return { ok: false };
    const reply = {
      reply_markup: message.reply_markup,
      caption: message.caption,
    };
    if (message.chat?.id == chatId)
      reply.reply_to_message_id = message.reply_to_message?.message_id;
    return await telegramBot.sendDocument(
      chatId,
      message.document.file_id,
      reply
    );
  }
};

module.exports = ApiFactory;
