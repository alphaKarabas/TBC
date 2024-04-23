const DbPermissions = require("../models/Permissions");
const Permissions = require("./Permissions");
const Chat = require("./Chat");

class Bot {
  constructor({ dbBot, telegramBot, owner }) {
    this.id = dbBot?._id;
    this.token = dbBot?.token;
    this.TelegramBot = telegramBot;
    this.isActive = false;
    this.userId = dbBot?.userId;
    this.userTelegramId = owner.telegramId;
    this.name = dbBot?.name;
    this.telegramId = dbBot?.telegramId;
    this.firstName = dbBot?.firstName;
    this.userName = dbBot?.userName;
    this.permissions = new Permissions(this);
    this.chat = new Chat(this);
  }

  myChats = async () => {
    const permissions = await DbPermissions.find({
      botId: this.id,
      chatId: { $lt: 0 },
      $or: [{ status: { $ne: "left" } }, { status: { $ne: "kicked" } }],
    });
    const chats = [];
    for (let i = 0; i < permissions.length; i++) {
      const permission = permissions[i];
      try {
        chats.push(await this.TelegramBot.getChat(permission.chatId));
      } catch (error) {
        console.log("Chat not found: " + permission.chatId);
        this.permissions.update(permission.chatId)
      }
    }
    return chats;
  };

  getId() {
    return this.id;
  }

  getUserId() {
    return this.userId;
  }

  getUserTelegramId() {
    return this.userTelegramId;
  }

  getTelegramBot() {
    return this.TelegramBot;
  }

  getName() {
    return this.name;
  }

  getNodesWithListener = async (listenerName) => {
    const extensionManager = new ExtensionManager();
    const flows = await Flow.find({ botId: this.id });
    let nodes = [];
    for (let i = 0; i < this.extensions?.length; i++) {
      const extensionId = this?.extensions[i];
      const extension = extensionManager?.getExtension(extensionId);
      const modules = extension?.getModulesWithListener(listenerName);
      if (!modules || modules.length == 0) continue;
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        for (let i = 0; i < flows.length; i++) {
          const flow = flows[i];
          const flowNodes = await Node.find({
            flowId: flow._id,
            extensionId: extensionId,
            moduleName: module.getInfo().name,
          });
          if (flowNodes.length > 0) nodes = nodes.concat(flowNodes);
        }
      }
    }
    return nodes;
  };
}

module.exports = Bot;
