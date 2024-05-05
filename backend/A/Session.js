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

  activateNode = async (node, flow) => {
    const data = this.getData(node)
    const listener = ModuleList.get(node.moduleId).listeners['activation']
    const apiFactory = new ApiFactory(node, this.bot);
    const bot = await apiFactory.createUniversalApi();
    const api = { id: node.id, data, node: node.data, next: this.getMethodNext(node, flow), bot }
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





  isForkOrTrigger = (node) => {
    const nodeModule = ModuleList.get(node.moduleId)
    return nodeModule.targets.length == 0 || nodeModule.sources.length > 1;
  }

  getReferencePoint = (id, sourceKey, data = {}) => {
    return { id, sourceKey, link: `${id}_${sourceKey}`, data }
  }

  addReferencePoint = (flow, nodeId, data = {}, sourceKey) => {
    flow.push(this.getReferencePoint(nodeId, sourceKey, data))
  }

  concatData = (oldData, newData) => {
    const data = { ...oldData }
    Object.keys(newData).forEach(type => {
      if (!data[type]) data[type] = {};
      data[type] = {
        ...data[type],
        ...newData[type]
      }
    })
    return data;
  }

  addDataToFlow = (flow, data) => {
    const referencePoint = flow[flow.length - 1]
    referencePoint.data = this.concatData(referencePoint.data, data)
  }

  loadNodeToFlow = (node, flow, data, sourceKey) => {
    if (this.isForkOrTrigger(node)) {
      this.addReferencePoint(flow, node.id, data, sourceKey)
    } else if (flow.length > 0) {
      this.addDataToFlow(flow, data)
    }
    return flow
  }





  getMethodNext = (node, flow=[]) => {
    const next = async (sourceKey, data) => {
      if (ModuleList.get(node.moduleId).type == 'sessional')
        await this.releaseSession();
      const updatedFlow = this.loadNodeToFlow(node, flow, data, sourceKey);
      const nextPaths = await this.getNextPaths(node._id, sourceKey);
      nextPaths.forEach(nextPath => {
        this.procesNextPath(nextPath, updatedFlow);
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
      if (!this.isNodeReady(nextSessionNodeId)) return;
      this.handOverControl(nextSessionNode);
      this.activateNode(nextSessionNode, flow);
    } else {
      this.currentNodeTemporaryStorage = null;
      this.currentNodeId = null;
    }
  };

  getNextPaths = async (nodeId, sourceKey) => {
    const edges = await Edge.find({
      source: nodeId,
      sourceKey,
    });

    if (!edges) return;
    const nodePromises = edges.map(edge => Node.findById(edge.target))
    const nodes = await Promise.all(nodePromises);

    const paths = nodes.map((node, index) => ({
      node: node,
      edge: edges[index]
    }));
    return paths;
  };

  procesNextPath = async (path, flow) => {
    const { node } = path;
    const releaseNodesStateMutex = await this.nodesStateMutex.acquire();
    if (!(node._id in this.nodesState)) {
      this.nodesState[node._id] = {
        waitingFlows: await this.getWaitingFlows(path, flow),
      };
    } else {
      console.log('procesNextPath', flow, node);


    }
    releaseNodesStateMutex();
    console.log('procesNextPath END', flow, this.nodesState[node._id]);

    // if (this.isNodeReady(node._id)) {
    //   if (ModuleList.get(node.moduleId).type == 'sessional') {

    //     if (this.currentNodeId != null) this.sessionNodeQueue.push(node._id)
    //     else {
    //       this.activateNode(node, flow)
    //       this.handOverControl(node);
    //     }
    //   } else {
    //     {
    //       this.activateNode(node, flow)
    //     }
    //   }

    // } else {
    // }
  }

  getWaitingFlows = async (path, comingFlow) => {
    const { edge, node } = path;
    let waitingFlows = []
    for (const usedKey of node.usedKeys) {
      if (usedKey.state == 'disconnected') {
        console.error(`The NODE: {id: ${node._id}, module: ${node.moduleId}}, is missing input: '${usedKey.inputKey}', which is disconnected!\nData:`, node.data);
        return null;
      } else if (usedKey.state == 'connected') {
        const edges = await Edge.find({ target: node.id });
        const potentiallyWaitingEdges = edges.filter(e => e._id != edge._id)
        const flows = potentiallyWaitingEdges.map(e => e.flow)
        console.log(edges, potentiallyWaitingEdges);
        let temporaryWaitingFlows = [{ comingFlow, isReady: true }]
        for (let i = 0; i < comingFlow.length; i++) {
          flows.forEach(flow => {
            if (!flow.length) return;
            const { target, sourceKey } = flow[i]
            const { cTarget, cSourceKey } = comingFlow[i]
            if (target == cTarget && sourceKey, cSourceKey)
              temporaryWaitingFlows.push({ ...flow[i], isReady: false })
          })
          if (temporaryWaitingFlows.length) {
            waitingFlows = temporaryWaitingFlows;
            temporaryWaitingFlows = [];
          } else {
            return waitingFlows;
          }
        }
      } else if (isRequired(node, usedKey.inputKey)) {
        console.error(`The NODE: {id: ${node._id}, module: ${node.moduleId}}, is missing input: '${usedKey.inputKey}', which is required!\nData:`, node.data);
        return null;
      }
    }
    return waitingFlows
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
