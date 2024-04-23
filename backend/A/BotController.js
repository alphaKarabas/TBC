const ApiFactory = require("./ApiFactory");
const Client = require("./Client");
const TelegramMessage = require("../models/TelegramMessage");
const Node = require("../models/Node");
const ModuleList = require("./ModuleList");

class BotController {
  constructor() {
    this.Listeners = {
      message: this.messageListaner,
      callback_query: this.callbackQueryListaner,
      // new_chat_members: this.newGroupMembersListaner,
      // left_chat_member: this.leftGroupMemberListaner,
      // my_chat_member: this.myChatMemberListaner,
      // edited_message: this.editedMessage,
    };
  }

  messageListaner = async (msg, session) => {
    Client.update(msg.from.id, msg.from);
    await saveClientMessage(msg, session);
    if (msg.chat.type != "private") {
      // switchToGrupeMessageListaner(msg, session);
      return;
    }
    Client.unblock(msg.from.id, session.bot.id);
    const command = findeCommand(msg);
    if (command) {
      await session.reset();
      // await session.resetIsNeeded();
      await goByCommand(msg, command, session);
    } else {

      const node = await session.findeCurrentNode();
      if (!node && msg.text) {
        await session.reset();
        // await session.resetIsNeeded();
        await goByCommand(msg, "/start", session);
      } else {
        useMessageModule(msg, node, session);
      }
    }
  };

  getListeners() {
    return this.Listeners;
  }

  callbackQueryListaner = async (query, session) => {
    Client.update(query.from.id, query.from);
    if (query.message.chat.id > 0) Client.unblock(query.from.id, session.bot.id);
    const telegramMessage = await TelegramMessage.findOne({
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      botId: session.bot.getId(),
    });
    if (!telegramMessage) return;
    const node = await Node.findById(telegramMessage.nodeId);
    if (!node) return;
    useCallbackQueryModule(query, node, session);
  };

  // newGroupMembersListaner = async (msg, session) => {
  //   const newMemberIsSelf = msg.new_chat_members.find(
  //     (member) => member.id == session.bot.telegramId
  //   );
  //   if (newMemberIsSelf) {
  //     let nodes = await session.bot.getNodesWithListener("joinedGroup");
  //     if (!nodes) return;
  //     await useGroupModules(msg, nodes, "joinedGroup", session);
  //   } else {
  //     let nodes = await session.bot.getNodesWithListener("newGroupMembers");
  //     if (!nodes) return;
  //     await useGroupModules(msg, nodes, "newGroupMembers", session);
  //   }
  // };

  // leftGroupMemberListaner = async (msg, session) => {
  //   const leftGroupMemberIsSelf =
  //     msg.left_chat_member.id == session.bot.telegramId;
  //   if (leftGroupMemberIsSelf) {
  //     let nodes = await session.bot.getNodesWithListener("leftGroup");
  //     if (!nodes) return;
  //     await useGroupModules(msg, nodes, "leftGroup", session);
  //   } else {
  //     let nodes = await session.bot.getNodesWithListener("leftGroupMember");
  //     if (!nodes) return;
  //     await useGroupModules(msg, nodes, "leftGroupMember", session);
  //   }
  // };

  // myChatMemberListaner = async (update, session) => {
  //   session.bot.permissions.change(update.chat.id, update.new_chat_member);
  // };
}

const findeCommand = (msg) => {
  const isCommand =
    msg.entities &&
    msg.entities[0]?.type == "bot_command" &&
    msg.entities[0].offset == 0;
  if (isCommand)
    return msg.text.slice(msg.entities[0].offset, msg.entities[0].length);
};

const goByCommand = async (msg, command, session) => {
  const node = await Node.findOne({ moduleId: 'command', data: { telegramCommand: command } });
  if (!node) return;
  await useCommandModule(msg, node, session);
};

const useCallbackQueryModule = async (query, node, session) => {
  const listener = ModuleList.get(node.moduleId).listeners['callback_query'];
  if (!listener) return;
  const apiFactory = new ApiFactory(node, session);
  const callbackQueryApi = await apiFactory.createCallbackQueryApi(query);
  session.useModule(callbackQueryApi, listener);
};

const useMessageModule = async (msg, node, session) => {
  const listener = ModuleList.get(node.moduleId).listeners['message'];
  if (!listener) {
    await session.reset();
    // await session.resetIsNeeded();
    return;
  }
  
  const apiFactory = new ApiFactory(node, session.bot);
  const bot = await apiFactory.createUniversalApi();
  const api = { msg, id: node.id, data: session.getData(node), node: node.data, next: session.getMethodNext(node), bot }
  await session.useModule(api, listener);
};

// const switchToGrupeMessageListaner = async (msg, session) => {
//   const command = findeCommand(msg);
//   if (command) {
//     const nodes = await session.bot.getNodesWithTelegramGroupCommand(command);
//     if (!nodes) return;
//     await useGroupModules(msg, nodes, "groupCommand", session);
//   } else {
//     let nodes = await session.bot.getNodesWithListener("groupMessage");
//     if (!nodes) return;
//     await useGroupModules(msg, nodes, "groupMessage", session);
//   }
// };

// const useGroupModules = async (msg, nodes, listenerName, session) => {
//   for (let i = 0; i < nodes.length; i++) {
//     const node = nodes[i];
//     const listener = ModuleList.get(node.moduleId).listeners[listenerName];
//     if (!listener) return;
//     const apiFactory = new ApiFactory(node, session);
//     const grupeApi = await apiFactory.createGrupeApi(msg);
//     if (!grupeApi) return;
//     await session.useModule(grupeApi, listener);
//   }
// };

const useCommandModule = async (msg, node, session) => {
  const listener = ModuleList.get(node.moduleId).listeners['command'];
  if (!listener) {
    await session.reset();
    // await session.resetIsNeeded();
    return;
  }
  const apiFactory = new ApiFactory(node, session.bot);
  const bot = await apiFactory.createUniversalApi();
  const api = { msg, data: {}, node: node.data, next: session.getMethodNext(node), bot }
  await session.useModule(api, listener);
};

const saveClientMessage = async (msg, session) => {
  await new TelegramMessage({
    botId: session.bot.getId(),
    isBot: false,
    chat_id: msg.chat.id,
    message_id: msg.message_id,
    sentDate: new Date(),
    data: msg,
  }).save();
};

module.exports = BotController;
