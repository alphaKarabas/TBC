const ApiFactory = require("./ApiFactory");
const Edge = require("../models/Edge");
const Node = require("../models/Node");
const ModuleList = require("./ModuleList");
const Mutex = require("async-mutex").Mutex;

class Session {
  constructor(chatId, telegramId, bot) {
    if (!chatId || !telegramId || !bot)
      return console.log(
        "EXEPTION: Session constructor get ",
        telegramId,
        chatId,
        bot
      );
    this.chatId = chatId;
    this.telegramId = telegramId;
    this.bot = bot;
    this.targetKey = null;
    this.currentNodeId = null;
    this.currentNodeTemporaryStorage = null;
    this.sessionNodeQueue = []
    this.nodesState = {};
    this.nodesData = {};
    // this.sessionNodeQueueMutex = new Mutex()
    this.nodesStateMutex = new Mutex()
    // this.nodesDataMutex = new Mutex()
  }

  reset = () => {
    this.targetKey = null;
    this.currentNodeId = null;
    this.currentNodeTemporaryStorage = null;
    this.nodesState = {};
    this.nodesData = {};
  };

  getStorage = () => {
    const storage = async (data) => {
      if (data) {
        this.currentNodeTemporaryStorage = data;
        return;
      }
      return this.currentNodeTemporaryStorage;
    };
    return storage.bind(this);
  };

  useModule = async (api, listener, node) => {
    if (!listener || !api) return;
    try {
      await listener(api);
    } catch (error) {
      console.log(`ERROR IN NODE:\n${error}\n${node}`);
    }
  };

  findeCurrentNode = async () => {
    if (!this.currentNodeId) return;
    return await Node.findById(this.currentNodeId);
  };

  handOverControl = (nextNode) => {
    this.currentNodeTemporaryStorage = null;
    this.currentNodeId = nextNode._id;
  };

  activateNode = async (node) => {
    const data = this.getData(node)
    const listener = ModuleList.get(node.moduleId).listeners['activation']
    const apiFactory = new ApiFactory(node, this.bot);
    const bot = await apiFactory.createUniversalApi();
    const api = { id: node.id, data, node: node.data, next: this.getMethodNext(node), bot }
    this.useModule(api, listener, node);
  };

  getData = (node) => {
    const data = {}
    for (const usedKey of node.usedKeys) {
      if (usedKey.state == 'connected')
        data[usedKey.inputKey] = this.nodesData[usedKey.link];
    }
    return data
  }

  getMethodNext = (node) => {
    const next = async (sourceKey, data) => {
      if (ModuleList.get(node.moduleId).type == 'sessional')
        await this.releaseSession()
      this.insertNodesData(node, data)
      const nextNodes = await this.getNextNodes(node._id, sourceKey);
      nextNodes.forEach(nextNode => {
        this.procesNextNode(nextNode);
      });
    };
    return next.bind(this);
  };

  releaseNode = (nodeId) => {
    delete this.nodesState[nodeId]
  }

  releaseSession = async () => {
    const nextSessionNodeId = this.sessionNodeQueue.shift();
    const nextSessionNode = await Node.findById(nextSessionNodeId);
    if (nextSessionNode) {
      this.handOverControl(nextSessionNode);
      this.activateNode(nextSessionNode);
    } else {
      this.currentNodeTemporaryStorage = null;
      this.currentNodeId = null;
    }
  };

  getNextNodes = async (nodeId, sourceKey) => {
    const edges = await Edge.find({
      source: nodeId,
      sourceKey,
    });

    if (!edges) return;
    const nodePromises = edges.map(edge => Node.findById(edge.target))
    const nodes = await Promise.all(nodePromises);
    return nodes;
  };

  procesNextNode = async (node) => {
    const releaseNodesStateMutex = await this.nodesStateMutex.acquire();
    if (!(node._id in this.nodesState)) {
      this.nodesState[node._id] = {
        waitingSignalsCount: await this.getWaitingSignalsCount(node) - 1,
        waitingDataList: this.getWaitingDataList(node),
      };
    } else {
      this.nodesState[node._id].waitingSignalsCount--;
    }
    releaseNodesStateMutex();

    if (this.isNodeReady(node._id)) {
      if (ModuleList.get(node.moduleId).type == 'sessional') {

        if (this.currentNodeId != null) this.sessionNodeQueue.push(node._id)
        else {
          this.activateNode(node)
          this.handOverControl(node);
        }
      } else {
        {
          this.activateNode(node)
        }
      }

    } else {
    }
  }

  getWaitingSignalsCount = async (node) => {
    const edges = await Edge.find({ target: node.id });
    return edges.length;
  }

  getWaitingDataList = (node) => {
    const waitingDataList = []
    node.usedKeys.forEach(usedKey => {
      if (usedKey.state == 'disconnected') {
        waitingDataList.push({ 'link': '' })
        console.error(`The NODE: {id: ${node._id}, module: ${node.moduleId}}, is missing input: '${usedKey.inputKey}', which is disconnected!\nData:`, node.data);
      } else if (usedKey.state == 'connected') {
        waitingDataList.push({
          'inputKey': usedKey.inputKey,
          'link': usedKey.link,
        })
      } else if (isRequired(node, usedKey.inputKey)) {
        waitingDataList.push({ 'link': '' })
        console.error(`The NODE: {id: ${node._id}, module: ${node.moduleId}}, is missing input: '${usedKey.inputKey}', which is required!\nData:`, node.data);
      }
    })
    return waitingDataList
  }

  insertNodesData = (node, data) => {
    for (let key in data) {
      if (node.outputKeys.get(key).inUse)
        this.nodesData[`${node._id}_${key}`] = data[key];
    }
  }

  isNodeReady = (nodeId) => {
    const nodeState = this.nodesState[nodeId]
    if (nodeState.waitingSignalsCount > 0) return false;
    for (let waitingData of nodeState.waitingDataList) {
      if (!(waitingData.link in this.nodesData)) return false
    }
    return true
  }

  getEndSession = () => {
    const endSession = async (chatId, telegramId) => {
      const sessionManager = new (require("./SessionManager"))();
      const session = sessionManager.getSession(
        chatId || this.chatId,
        telegramId || this.telegramId,
        this.bot
      );
      if (session) await this.reset();
    };
    return endSession;
  };
}

const isRequired = (node, inputKey) => {
  return ModuleList.get(node.moduleId).targets
    .find(target => target.key == inputKey).required
}

module.exports = Session;
