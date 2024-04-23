const DBBot = require("../models/Bot");
const DBUser = require("../models/User");
const Bot = require("./Bot");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
const config = require("config");
const ngrok = require("ngrok");
const jwt = require("jsonwebtoken");

class BotManager {
  constructor() {
    if (BotManager.exists) {
      return BotManager.instanse;
    }
    BotManager.instanse = this;
    BotManager.exists = true;
    this.bots = {};
  }

  load = async () => {
    try {
      const url = await ngrok.connect({
        authtoken: config.get("authtoken"),
        addr: config.get("serverPort"),
      });
      this.url = url;
    } catch (error) {
      console.log(error);
    }
  };

  loadBots = async () => {
    const dbBots = await DBBot.find({
      isActive: true,
    });
    for (let i = 0; i < dbBots?.length; i++) {
      const dbBot = dbBots[i];
      await this.loadBot(dbBot);
    }
  };

  chekBot = async (dbBot) => {
    let req;
    try {
      const telegramBotInfo = await fetch(
        `https://api.telegram.org/bot${dbBot.token}/getMe`
      );
      req = await telegramBotInfo.json();
    } catch (error) {
      return;
    }
    if (!req.ok) {
      console.log(
        `WORNING Bot: "${dbBot?.name}" Id: "${dbBot?._id}" UserId: "${dbBot?.userId}"\n\tInvalid token`
      );
      return;
    }
    await this.updateBotData(dbBot, req.result);
    return req.ok;
  };

  updateBotDataById = async (id, data) => {
    const dbBot = await DBBot.findById(id);
    return await this.updateBotData(dbBot, data);
  };

  updateBotData = async (dbBot, data) => {
    let needSave = false;
    if (dbBot.telegramId != data.id) {
      dbBot.telegramId = data.id;
      needSave = true;
    }
    if (dbBot.firstName != data.first_name) {
      dbBot.firstName = data.first_name;
      needSave = true;
    }
    if (dbBot.userName != data.username) {
      dbBot.userName = data.username;
      needSave = true;
    }
    if (dbBot.canJoinGroups != data.can_join_groups) {
      dbBot.canJoinGroups = data.can_join_groups;
      needSave = true;
    }
    if (dbBot.canReadAllGroupMessages != data.can_read_all_group_messages) {
      dbBot.canReadAllGroupMessages = data.can_read_all_group_messages;
      needSave = true;
    }
    if (dbBot.supportsInlineQueries != data.supports_inline_queries) {
      dbBot.supportsInlineQueries = data.supports_inline_queries;
      needSave = true;
    }
    if (needSave) await dbBot.save();
  };

  loadBot = async (dbBot) => {
    try {
      if (!dbBot) return;
      const tokenOk = await this.chekBot(dbBot);
      if (!tokenOk) return;
      const owner = await DBUser.findOne({ _id: dbBot?.userId });
      const telegramBot = new TelegramBot(dbBot?.token);
      const token = jwt.sign(
        { id: dbBot._id, token: dbBot?.token },
        config.get("secretJWTKey"),
        {}
      );
      telegramBot.setWebHook(`${this.url}/api/telegramBot?token=${token}`, {
        autoOpen: false,
      });
      const bot = new Bot({ dbBot, telegramBot, owner });
      this.bots[dbBot._id] = bot;
      console.log(
        `LOADED Bot: "${dbBot?.name}" Id: "${dbBot?._id}" UserId: "${dbBot?.userId}"`
      );
      return bot;
    } catch (error) {
      console.log(`FAILD Create TelegramBot:`);
      console.log(dbBot);
      console.log(error);
    }
  };

  loadBotById = async (id) => {
    const dbBot = await DBBot.findOne({
      _id: id,
      isActive: true,
    });
    await this.loadBot(dbBot);
  };

  unloadBot = async (bot) => {
    if (!bot) return;
    await this.stopBot(bot);
    const telegramBot = bot.getTelegramBot();
    await telegramBot.stopPolling();
    for (const key in this.bots) {
      if (this.bots.hasOwnProperty(key)) {
        const oldBot = this.bots[key];
        if (oldBot && oldBot.id == bot.id) this.bots[key] = undefined;
      }
    }

    console.log(
      `UNLOADED Bot: "${bot.name}" Id: "${bot.id}" UserId: "${bot.getUserId()}"`
    );
  };

  unloadBotById = async (id) => {
    const bot = await this.getBot(id);
    await this.unloadBot(bot);
  };

  updateBot = async (id, controller) => {
    try {
      await this.unloadBotById(id);
      await this.loadBotById(id);
      await this.startBotById(id, controller);
    } catch (error) {
      console.log(`FAILD Update TelegramBot:`);
      console.log(error);
    }
  };

  startAll = async (controller) => {
    for (const key in this.bots) {
      if (this.bots.hasOwnProperty(key)) {
        const bot = this.bots[key];
        await this.startBot(bot, controller);
      }
    }
  };

  startBot = async (bot, controller) => {
    if (!bot || !controller) return;
    const telegramBot = bot.getTelegramBot();
    const dbUser = await DBUser.findById(bot.userId);
    if (dbUser.authKey) {
      telegramBot.on("message", async (msg) =>
        this.authKeyChekListener(msg, bot, dbUser)
      );

      console.log(
        `STARTED Auth Bot: "${bot.getName()}" Id: "${bot.getId()}" UserId: "${bot.getUserId()}"`
      );
    } else {
      this.useListeners(bot, controller.getListeners());
    }

    // telegramBot.openWebHook()
  };

  useListeners = (bot, listeners) => {
    for (const key in listeners) {
      if (Object.hasOwnProperty.call(listeners, key)) {
        const listener = listeners[key];
        bot.getTelegramBot().on(key, async (update) => {
          const session = await this.getSession(update, bot);
          if (!session) {
            console.log("SESSION DONT CREAT WITH UPDATE: ", update);
            return;
          }
          listener(update, session);
        });
      }
    }
    console.log(
      `STARTED Bot: "${bot.getName()}" Id: "${bot.getId()}" UserId: "${bot.getUserId()}"`
    );
  };

  getSession = async (update, bot) => {
    const message = update?.message || update;
    if (!message) return;
    const telegramId = update.from.id;
    const chatId = message.chat.id;
    const sessionManager = new (require("./SessionManager"))();
    const session = sessionManager.getSession(chatId, telegramId, bot);
    return session;
  };

  authKeyChekListener = async (msg, bot, dbUser) => {
    const text = msg.text;
    if (text == dbUser.authKey) {
      dbUser.telegramId = msg.from?.id;
      dbUser.authKey = undefined;
      await dbUser.save();
      bot.getTelegramBot().sendMessage(msg.chat?.id, "Success!");
      await this.updateBot(bot.id);
    } else bot.getTelegramBot().sendMessage(msg.chat?.id, "Invalid key");
  };

  startBotById = async (id, controller) => {
    const bot = await this.getBot(id);
    await this.startBot(bot, controller);
  };

  stopAll = async () => {
    for (const key in this.bots) {
      if (this.bots.hasOwnProperty(key)) {
        const bot = this.bots[key];
        this.stopAll(bot);
      }
    }
  };

  stopBot = async (bot) => {
    if (!bot) return;
    const telegramBot = bot.getTelegramBot();
    await telegramBot.removeAllListeners();
    await telegramBot.closeWebHook();
    console.log(
      `STOPED Bot: "${bot.getName()}" Id: "${bot.getId()}" UserId: "${bot.getUserId()}"`
    );
  };

  stopBotById = async (id) => {
    const bot = await this.getBot(id);
    await this.stopBot(bot);
  };

  getBot = async (id) => {
    const bot = await this.bots[id];
    return bot;
  };

  renameBot = async (id, name) => {
    const bot = await this.getBot(id);
    if (!bot) return;
    bot.setName(name);
  };
}

module.exports = BotManager;
