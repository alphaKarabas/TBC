const Flow = require("../models/Flow");
const Bot = require("../models/Bot");
const User = require("../models/User");
const Node = require("../models/Node");
const Edge = require("../models/Edge");
const BotManager = require("../A/BotManager");
const Controller = require("../A/BotController");
const fetch = require("node-fetch");
const config = require("config");

class BotController {
  async getBots(req, res) {
    try {
      const id = req.query?.id;
      const userId = req.user.id;

      if (id) {
        try {
          let bot = await Bot.findOne({ _id: id });
          if (bot.userId != userId)
            return res.status(403).json({ message: "Access denied" });
          return res.json({
            message: "Bot find",
            bot,
          });
        } catch (error) {
          return res.json({ message: "Bot not find" });
        }
      }

      let bots = await Bot.find({ userId: req.user.id });

      return res.json({
        message: "Bots find",
        bots,
      });
    } catch (error) {
      console.log(error);
      return res.json({ message: error });
    }
  }

  async creataBot(req, res) {
    try {
      let { name } = req.body;
      if (!name) {
        return res.json({ message: "Invalid data" });
      }

      const nameIsTaken = await Bot.findOne({ userId: req.user.id, name });
      if (nameIsTaken) {
        name += ` (${new Date().getMilliseconds()})`;
      }

      const newBot = new Bot({
        token: "",
        isActive: false,
        userId: req.user.id,
        name: name,
        createdDate: new Date(),
      });

      await newBot.save();

      let newBotsList;
      try {
        newBotsList = await Bot.find({ userId: req.user.id });
      } catch (error) {
        return res.json({ message: "New bots list not created" });
      }

      let telegramIdVerification;
      const user = await User.findById(req.user.id);
      const userHesTelegramId = user.telegramId;
      if (!userHesTelegramId) {
        if (!user.authKey) {
          const authKey = Math.floor(Math.random() * 1000000);
          user.authKey = authKey;
          await user.save();
        }
        telegramIdVerification = user.authKey;
      }
      for (let i = 0; i < newBotsList.length; i++) {
        const bot = newBotsList[i];
        if (bot.isActive) {
          const newBot = { ...bot._doc };
          newBot.telegramIdVerification = telegramIdVerification;
          newBotsList[i] = newBot;
        }
      }

      return res.json({
        message: "Bot created",
        bots: newBotsList,
      });
    } catch (error) {
      console.log(error);
      return res.json({ message: error });
    }
  }

  async deleteBot(req, res) {
    try {
      const userId = req.user.id;
      if (!req.query.id) {
        return res.json({ message: "Invalid query" });
      }

      try {
        const bot = await Bot.findOne({ _id: req.query.id });
        if (bot.userId != userId)
          return res.status(403).json({ message: "Access denied" });
        new BotManager().unloadBotById(req.query.id);
        await Bot.deleteOne({ _id: req.query.id });
        const flows = await Flow.find({ botId: req.query.id });
        flows.forEach(async (flow) => {
          await Node.deleteMany({ flowId: flow._id });
          await Edge.deleteMany({ flowId: flow._id });
        });
        await Flow.deleteMany({ botId: req.query.id });
      } catch (error) {
        return res.json({ message: "Failed to delete Bot" });
      }

      let newBotsList;
      try {
        newBotsList = await Bot.find({ userId: req.user.id });
      } catch (error) {
        return res.json({ message: "New bots list not created" });
      }

      return res.json({
        message: "Bot deleted",
        bots: newBotsList,
      });
    } catch (error) {
      console.log(error);
      return res.json({ message: error });
    }
  }

  async copyBot(req, res) {
    try {
      const { name, id } = req.body;
      const userId = req.user.id;
      if (!name || !id) {
        return res.json({ message: "Invalid query" });
      }

      try {
        const bot = await Bot.findOne({ _id: id });

        if (bot.userId != userId)
          return res.status(403).json({ message: "Access denied" });

        const newBot = new Bot({
          name: name,
          isActive: false,
          userId: userId,
          createdDate: new Date(),
        });
        const newFlow = new Flow({
          botId: newBot._id,
          createdDate: new Date(),
          lastChangeDate: new Date(),
          page: 1,
        });
        const newNodes = [];
        const newEdges = [];

        const flows = await Flow.find({ botId: id });

        for (let i = 0; i < flows.length; i++) {
          const flow = flows[i];

          const nodes = await Node.find({ flowId: flow._id });
          const edges = await Edge.find({ flowId: flow._id });

          for (let j = 0; j < nodes.length; j++) {
            const node = nodes[j];
            const newNode = new Node({
              flowId: newFlow._id,
              moduleId: node.moduleId,
              position: node.position,
              keyNames: node.keyNames,
              usedKeys: node.usedKeys,
              data: node.data,
            });

            newNodes.push(newNode);
          }

          for (let j = 0; j < edges.length; j++) {
            const edge = edges[j];
            let source;
            let target;
            for (let y = 0; y < nodes.length; y++) {
              const node = nodes[y];
              if (node._id + "" == edge.source + "") {
                source = newNodes[y]._id;
                break;
              }
            }

            for (let y = 0; y < nodes.length; y++) {
              const node = nodes[y];
              if (node._id + "" == edge.target + "") {
                target = newNodes[y]._id;
                break;
              }
            }

            if (!source) await Node.deleteOne({ _id: newFlow.source });
            if (!target) await Node.deleteOne({ _id: newFlow.target });
            if (!source || !target) continue;

            const newEdge = new Edge({
              flowId: newFlow._id,
              source: source,
              sourceKey: edge.sourceKey,
              target: target,
              targetKey: edge.targetKey,
            });
            newEdges.push(newEdge);
          }
        }
        await newBot.save();
        await newFlow.save();
        for (let i = 0; i < newNodes.length; i++) {
          const newNode = newNodes[i];
          await newNode.save();
        }
        for (let i = 0; i < newEdges.length; i++) {
          const newEdge = newEdges[i];
          await newEdge.save();
        }
      } catch (error) {
        return res.json({ message: "Failed to copy Bot" });
      }

      let newBotsList;
      try {
        newBotsList = await Bot.find({ userId: req.user.id });
      } catch (error) {
        return res.json({ message: "New bots list not created" });
      }

      return res.json({
        message: "Bot copyed",
        bots: newBotsList,
      });
    } catch (error) {
      console.log(error);
      return res.json({ message: error });
    }
  }

  async patchBot(req, res) {
    try {
      const userId = req.user.id;
      const { patch, token, isActive, name } = req.body;
      const id = req.query.id;

      let bot;
      try {
        bot = await Bot.findOne({ _id: id });
      } catch (error) {
        return res.json({ message: "Bot not find" });
      }

      if (!bot) {
        return res.json({ message: "Bot not find" });
      }

      if (bot.userId != userId)
        return res.status(403).json({ message: "Access denied" });

      if (!patch) {
        return res.json({ message: "Nothing to change" });
      }

      if (!id) {
        return res.json({ message: "Invalid query" });
      }

      const botManager = new BotManager();

      if (patch.find((key) => key == "name")) {
        bot.name = name;
        await bot.save();
        await botManager.renameBot(id, name);
      }

      if (patch.find((key) => key == "isActive")) {
        const resActive = isActive ? true : false;
        bot.isActive = resActive;
        await bot.save();

        if (resActive) {
          await botManager.loadBotById(id);
          const controller = new Controller();
          await botManager.startBotById(id, controller);
        } else {
          await botManager.unloadBotById(id);
        }
      }

      if (patch.find((key) => key == "token")) {
        if (token) {
          const telegramBotInfo = await fetch(
            `https://api.telegram.org/bot${token}/getMe`
          );
          const result = await telegramBotInfo.json();
          if (!result.ok) return res.json({ message: "Invalid token" });

          bot.token = token;
          bot.isActive = true;
          await bot.save();
          const controller = new Controller();
          await botManager.startBot(await botManager.loadBot(bot), controller);
        } else {
          bot.token = undefined;
          bot.telegramId = undefined;
          bot.firstName = undefined;
          bot.userName = undefined;
          bot.canJoinGroups = undefined;
          bot.canReadAllGroupMessages = undefined;
          bot.supportsInlineQueries = undefined;
          bot.isActive = false;
          await bot.save();
          await new BotManager().unloadBotById(id);
        }
      }

      let newBotsList;
      try {
        newBotsList = await Bot.find({ userId: req.user.id });
      } catch (error) {
        return res.json({ message: "New bots list not created" });
      }

      return res.json({
        message: "Bot patched",
        bots: newBotsList,
      });
    } catch (error) {
      console.log(error);
      return res.json({ message: error });
    }
  }

  async verificationKey(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      const userHesTelegramId = user.telegramId;
      let authKey;
      if (!userHesTelegramId) {
        if (!user.authKey) {
          const authKey = Math.floor(Math.random() * 1000000);
          user.authKey = authKey;
          await user.save();
        }
        authKey = user.authKey;
      }

      return res.json({
        message: "Key",
        authKey,
      });
    } catch (error) {
      console.log(error);
      return res.json({ message: error });
    }
  }
}

module.exports = new BotController();
