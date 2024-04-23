const Flow = require("../models/Flow");
const Node = require("../models/Node");
const Edge = require("../models/Edge");
const Bot = require("../models/Bot");

class FlowController {
  updateNodePosition = async (req, res) => {
    const { xPos, yPos } = req.body;
    if (!Number.isFinite(xPos) || !Number.isFinite(yPos))
      return res.status(400).json({ message: "Invalid position data" });

    return await updateNodeIfAuthorized(req, res, { position: { x: xPos, y: yPos } });
  };

  updateNodeData = async (req, res) => {
    const { data } = req.body;
    if (!data) return res.status(400).json({ message: "No data provided" });

    return await updateNodeIfAuthorized(req, res, { data });
  };

  updateOutputKeys = async (req, res) => {
    const { outputKeys } = req.body;
    if (!(typeof outputKeys === 'object'))
      return res.status(400).json({ message: "Invalid output keys" });
    console.log(outputKeys);
    return await updateNodeIfAuthorized(req, res, { outputKeys });
  };

  updateUsedKeys = async (req, res) => {
    const { usedKeys } = req.body;
    if (!Array.isArray(usedKeys))
      return res.status(400).json({ message: "Invalid used keys" });

    return await updateNodeIfAuthorized(req, res, { usedKeys });
  };

  updateHandles = async (req, res) => {
    const { handles } = req.body;
    if (!(typeof outputKeys === 'handles'))
      return res.status(400).json({ message: "Invalid handles" });

    return await updateNodeIfAuthorized(req, res, { handles });
  };

  changeUsedKeysState = async (req, res) => {
    const { nodeIds, links, state } = req.body;
    if (!Array.isArray(nodeIds) || !Array.isArray(nodeIds))
      return res.status(400).json({ message: "Invalid data" });

    try {
      await Node.updateMany(
        {
          _id: { $in: nodeIds }
        },
        {
          $set: {
            "usedKeys.$[elem].state": state,
          }
        },
        {
          arrayFilters: [{ "elem.link": { $in: links } }]
        }
      );

      return res.status(202).json({
        message: "Used keys state changed",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Used keys not cleared" });
    }
  };

  renameUsedKeys = async (req, res) => {
    const { nodeIds, links, name } = req.body;
    if (!Array.isArray(nodeIds))
      return res.status(400).json({ message: "Invalid node ids" });

    try {
      await Node.updateMany(
        {
          _id: { $in: nodeIds }
        },
        {
          $set: {
            "usedKeys.$[elem].name": name,
          }
        },
        {
          arrayFilters: [{ "elem.link": { $in: links } }]
        }
      );

      return res.status(202).json({
        message: "Used keys cleared",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Used keys not cleared" });
    }
  };

  setUsedKeys = async (req, res) => {
    const { newUsedKeys } = req.body;
    if (!Array.isArray(newUsedKeys))
      return res.status(400).json({ message: "Invalid new Used Keys" });

    try {
      for (const update of newUsedKeys) {
        await Node.updateOne( 
          { _id: update.nodeId },
          {
            $set: {
              usedKeys: update.usedKeys,
              new: false
            }
          }
        );
      }

      return res.status(202).json({
        message: "Used keys updated",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Used keys updated" });
    }
  };

  getFlow = async (req, res) => {
    try {
      const id = req.query?.id;
      const page = req.query?.page;
      if (!id || !page || id < 0)
        return res.status(400).json({ message: "Invalid params" });

      const accessOk = await accessCheckByBotId(req.user.id, id);
      if (!accessOk) return res.status(403).json({ message: "Access denied" });
      const bot = await Bot.findOne({ _id: id });
      if (!bot) return res.status(400).json({ message: "Bot not find" });

      const flow = await Flow.findOne({ botId: bot._id, page: page });
      if (!bot) return res.status(400).json({ message: "Flow not find" });

      let sentFlow;

      if (!flow) {
        const newFlow = new Flow({
          botId: id,
          createdDate: new Date(),
          lastChangeDate: new Date(),
          page: page,
        });
        newFlow.save();
        sentFlow = {
          id: newFlow._id,
          viewportPosition: newFlow.viewportPosition,
          page: newFlow.page,
          nodes: [],
          edges: [],
        };
      } else {
        const nodes = await Node.find({ flowId: flow._id });
        const edges = await Edge.find({ flowId: flow._id });
        sentFlow = {
          id: flow._id,
          viewportPosition: flow.viewportPosition,
          page: flow.page,
          nodes: nodes,
          edges: edges,
        };
      }

      return res.status(200).json({
        message: "Flow find",
        flow: sentFlow,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Flow not find" });
    }
  };

  changeViewportPosition = async (req, res) => {
    try {
      const id = req.query?.id;
      const { zoom, x, y } = req.body;
      if (
        !id ||
        !Number.isFinite(zoom) ||
        !Number.isFinite(x) ||
        !Number.isFinite(y)
      )
        return res.status(400).json({ message: "Invalid params" });

      const accessOk = await accessCheckByFlowId(req.user.id, id);
      if (!accessOk) return res.status(403).json({ message: "Access denied" });

      const flow = await Flow.findOne({ _id: id });
      if (!flow)
        return res.status(204).json({ message: "Viewport position not find" });
      flow.viewportPosition = { zoom, x, y };
      flow.save();

      return res.status(202).json({
        message: "Viewport position save",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Viewport position not change" });
    }
  };

  addEdge = async (req, res) => {
    try {
      const { flowId, source, sourceKey, target, targetKey } = req.body;

      if (!flowId || !source || !sourceKey || !target || !targetKey)
        return res.status(400).json({ message: "Invalid params" });

      const accessOk = await accessCheckByFlowId(req.user.id, flowId);
      if (!accessOk) return res.status(403).json({ message: "Access denied" });
      const alreadyExisting = await Edge.findOne({
        flowId: flowId,
        source: source,
        sourceKey: sourceKey,
        target: target,
        targetKey: targetKey,
      });

      if (alreadyExisting) {
        return res.status(208).json({
          message: "Edge already existing",
        });
      }

      const edge = new Edge({
        flowId: flowId,
        source: source,
        sourceKey: sourceKey,
        target: target,
        targetKey: targetKey,
      });
      await edge.save();

      return res.status(201).json({
        id: edge._id,
        message: "Edge Added",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Edge not Added" });
    }
  };

  deleteEdge = async (req, res) => {
    try {
      const { id, nodeId, key } = req.query;
      if (id) {
        const accessOk = await accessCheckByEdgeId(req.user.id, id);
        if (!accessOk)
          return res.status(403).json({ message: "Access denied" });

        await Edge.deleteOne({ _id: id });

        return res.status(200).json({
          message: "Edge deleted",
        });
      } else if (nodeId && key) {
        const accessOk = await accessCheckByNodeId(req.user.id, nodeId);
        if (!accessOk)
          return res.status(403).json({ message: "Access denied" });

        await Edge.deleteMany({ source: nodeId, sourceKey: key });
        await Edge.deleteMany({ target: nodeId, targetKey: key });

        return res.status(200).json({
          message: "Edge deleted",
        });
      } else return res.status(400).json({ message: "Invalid params" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Edge not deleted" });
    }
  };

  addNode = async (req, res) => {
    try {
      const { flowId, moduleId, data, position, outputKeys, usedKeys, handles } = req.body;

      if (!flowId || !moduleId || !position || !usedKeys || !outputKeys)
        return res.status(400).json({ message: "Invalid params" });

      const accessOk = await accessCheckByFlowId(req.user.id, flowId);
      if (!accessOk) return res.status(403).json({ message: "Access denied" });
      
      const node = new Node({
        flowId: flowId,
        moduleId: moduleId,
        position: position,
        handles: handles,
        outputKeys: outputKeys,
        usedKeys: usedKeys,
        data: data || { _: false },
        new: true
      });

      node.save();
      return res.status(201).json({
        id: node._id,
        message: "Noade Added",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Noade not Added" });
    }
  };

  deleteNode = async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ message: "Invalid params" });

      const accessOk = await accessCheckByNodeId(req.user.id, id);
      if (!accessOk) return res.status(403).json({ message: "Access denied" });

      await Edge.deleteMany({ source: id });
      await Edge.deleteMany({ target: id });
      await Node.deleteOne({ _id: id });

      return res.status(200).json({
        message: "Node deleted",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Node not deleted" });
    }
  };
}

const updateNodeIfAuthorized = async (req, res, update) => {
  const id = req.params.id;
  const accessOk = await accessCheckByNodeId(req.user.id, id);
  if (!accessOk) return res.status(403).json({ message: "Access denied" });

  try {
    const updateResult = await Node.updateOne({ _id: id }, update);
    if (!updateResult.acknowledged)
      return res.status(404).json({ message: "Node not found" });

    return res.status(202).json({ message: 'Node changed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const accessCheckByNodeId = async (userId, nodeId) => {
  try {
    if (!nodeId || !userId) return false;
    const node = await Node.findById(nodeId);
    return accessCheckByFlowId(userId, node?.flowId);
  } catch (error) {
    console.log(error);
    return false
  }

};
const accessCheckByEdgeId = async (userId, edgeId) => {
  try {
    if (!edgeId || !userId) return false;
    const edge = await Edge.findOne({ _id: edgeId });
    return accessCheckByFlowId(userId, edge?.flowId);
  } catch (error) {
    console.log(error);
    return false
  }
};

const accessCheckByFlowId = async (userId, flowId) => {
  try {
    if (!flowId || !userId) return false;
    const flow = await Flow.findOne({ _id: flowId });
    return accessCheckByBotId(userId, flow?.botId);
  } catch (error) {
    console.log(error);
    return false
  }

};

const accessCheckByBotId = async (userId, botId) => {
  try {
    if (!botId || !userId) return false;
    const bot = await Bot.findOne({ _id: botId });
    if (bot?.userId == userId) return true;
    return false;
  } catch (error) {
    console.log(error);
    return false
  }

};

module.exports = new FlowController();
