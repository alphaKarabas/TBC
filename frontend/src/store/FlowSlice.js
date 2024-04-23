import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { applyEdgeChanges, applyNodeChanges, updateEdge } from "reactflow";
import moduleDataTypes from "../pages/botEditer/moduleDataTypes";
import moduleDefaultHandles from "../pages/botEditer/moduleDefaultHandles";

function buildTree(nodes, edges) {
  const tree = {};

  nodes.forEach(node => {
    tree[node._id] = {
      outputKeys: node.outputKeys,
      usedKeys: node.usedKeys,
      moduleId: node.moduleId,
      handles: node.handles,
      parents: [],
      children: [],
      new: node.new
    };
  });

  edges.forEach(edge => {
    const target = tree[edge.target];
    const source = tree[edge.source];

    if (!target || !source) {
      console.error("Target or source not found for edge:", edge);
      return;
    }

    target.parents.push({
      id: edge.source,
      sourceKey: edge.sourceKey
    });

    source.children.push({
      id: edge.target,
      targetKey: edge.targetKey
    });
  });

  return tree;
}

export function getOutputDataLinksByTypes(dataTree, id) {
  let dataLinksByTypes = {};

  const nodeData = dataTree[id];
  if (!nodeData) return;
  console.log(dataTree);

  const outputDataTypes = moduleDataTypes[nodeData.moduleId].outputs;
  console.log(outputDataTypes);

  outputDataTypes.forEach(outputDataType => {
    const key = outputDataType.key;
    const typeKey = outputDataType.type;

    if (!nodeData.outputKeys[key].inUse) return;
    if (!dataLinksByTypes[typeKey]) dataLinksByTypes[typeKey] = {};

    dataLinksByTypes[typeKey][nodeData.outputKeys[key].name] = {
      'link': `${id}_${key}`,
      'sourceId': id,
      'outputKey': key,
      'type': typeKey,
      'name': nodeData.outputKeys[key].name
    };

  });

  return dataLinksByTypes
}

function concatDataLinksByTypes(oldDataLinksByTypes, newDataLinksByTypes) {
  const dataLinksByTypes = { ...oldDataLinksByTypes }
  Object.keys(newDataLinksByTypes).forEach(type => {
    if (!dataLinksByTypes[type]) dataLinksByTypes[type] = {};
    dataLinksByTypes[type] = {
      ...dataLinksByTypes[type],
      ...newDataLinksByTypes[type]
    }
  })
  return dataLinksByTypes;
}

export function collectAvailableDataLinksByTypes(dataTree, startNodeId) {
  let dataLinksByTypes = {};
  function recurse(nodeId) {
    const node = dataTree[nodeId];
    if (!node || node.parents.length === 0) return;
    node.parents.forEach(parent => {
      recurse(parent.id);

      const newDataLinksByTypes = getOutputDataLinksByTypes(dataTree, parent.id);
      dataLinksByTypes = concatDataLinksByTypes(dataLinksByTypes, newDataLinksByTypes)
    });
  }

  if (startNodeId) {
    recurse(startNodeId);
  }

  return dataLinksByTypes;
}

function getOutputDataLinks(dataTree, id) {
  const dataLinks = [];
  const nodeData = dataTree[id];
  if (!nodeData) return;
  const outputDataTypes = moduleDataTypes[nodeData.moduleId].outputs;

  outputDataTypes.forEach(outputDataType => {
    const key = outputDataType.key;
    dataLinks.push(`${id}_${key}`)
  });

  return dataLinks
}

function collectAvailableDataLinks(dataTree, startNodeId) {
  let dataLinks = [];

  function recurse(nodeId) {
    const node = dataTree[nodeId];
    if (!node || node.parents.length === 0) return;

    node.parents.forEach(parent => {
      dataLinks = dataLinks.concat(getOutputDataLinks(dataTree, parent.id))
      recurse(parent.id);
    });
  }

  if (startNodeId) {
    recurse(startNodeId);
  }

  return dataLinks;
}

function DataLinksByTypesToDataLinks(dataLinksByTypes) {
  const dataLinks = []
  Object.keys(dataLinksByTypes).map(type => {
    Object.keys(dataLinksByTypes[type]).map(name => {
      dataLinks.push({
        ...dataLinksByTypes[type][name],
        'name': name,
        'type': type
      })
    })
  })
  return dataLinks
}

function chooseDataLink(dataLinksByNames) {
  return dataLinksByNames[Object.keys(dataLinksByNames).pop()]
}

export function autoChooseDataLink(dataTree, nodsIds, dataLinksByTypes) {
  return nodsIds.map(id => {
    const node = dataTree[id]
    const usedKeys = node.usedKeys.map(usedKey => {
      if (usedKey.state == 'connected') return usedKey;
      if (!usedKey.type) return usedKey
      if (node.new)
        return { ...chooseDataLink(dataLinksByTypes[usedKey.type]), ...usedKey }
      if (dataLinksByTypes[usedKey.type] && dataLinksByTypes[usedKey.type][usedKey.name])
        return { ...dataLinksByTypes[usedKey.type][usedKey.name], ...usedKey }
      return usedKey
    })
    return { nodeId: id, usedKeys }
  })
}

export function getAllChildrenId(dataTree, startNodeId) {
  let childrenId = [];

  function recurse(nodeId) {
    const node = dataTree[nodeId];
    if (node?.children.length === 0) return;

    node.children.forEach(child => {
      childrenId.push(child.id)
      recurse(child.id);
    });
  }

  if (startNodeId) {
    recurse(startNodeId);
  }

  return childrenId;
}

export const loadFlow = createAsyncThunk(
  "flow/fetchFlow",
  async ({ id, page }) => {
    try {
      const response = await axios.get(
        `${process.env.React_App_SERVER_URL}/api/flow?id=${id}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return response.data;
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const changePublicNodeData = createAsyncThunk(
  "flow/fetchChangePublicNodeData",
  async ({ id, data }) => {
    try {
      const adoptedData = {
        id: id,
        data: data,
      };
      const response = await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/flow/node/${id}/data`,
        { data },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return { data: response.data, node: adoptedData, id: id };
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const addNode = createAsyncThunk(
  "flow/fetchAddNode",
  async ({ node }) => {
    try {
      const inputs = moduleDataTypes[node.data.privateData.moduleId].inputs
      const usedKeys = inputs.map(input => ({ 'inputKey': input.key, 'type': input.type, 'state': 'not-serialized' }))

      const response = await axios.post(
        `${process.env.React_App_SERVER_URL}/api/flow/node`,
        {
          flowId: node.data.privateData.flowId,
          moduleId: node.data.privateData.moduleId,
          outputKeys: node.data.privateData.outputKeys,
          usedKeys: usedKeys,
          data: node.data.publicData,
          position: node.position,
          handles: moduleDefaultHandles[node.data.privateData.moduleId]
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return { data: response.data, node: node };
    } catch (e) {
      console.log(e);
    }
  }
);

export const deleteNode = createAsyncThunk(
  "flow/fetchDeleteNode",
  async ({ id }) => {
    try {
      const response = await axios.delete(
        `${process.env.React_App_SERVER_URL}/api/flow/node/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return { data: response.data, id: id };
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const savePosition = createAsyncThunk(
  "flow/fetchSavePosition",
  async ({ id, xPos, yPos }) => {
    try {
      await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/flow/node/${id}/position`,
        {
          xPos: xPos,
          yPos: yPos,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const saveViewportPosition = createAsyncThunk(
  "flow/fetchSaveViewportPosition",
  async ({ id, x, y, zoom }) => {
    try {
      const response = await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/flow?id=${id}`,
        {
          x: x,
          y: y,
          zoom: zoom,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );
      return { x, y, zoom };
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const addEdge = createAsyncThunk(
  "flow/fetchAddEdge",
  async ({ flowId, edge }) => {
    try {
      const response = await axios.post(
        `${process.env.React_App_SERVER_URL}/api/flow/edge`,
        {
          flowId: flowId,
          source: edge.source,
          sourceKey: edge.sourceHandle,
          target: edge.target,
          targetKey: edge.targetHandle,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );

      return { edge: edge, data: response.data };
    } catch (e) {
      console.log(e);
    }
  }
);


function addStateToUsedKey(usedKey, state) {
  const resState = usedKey.type ? state : 'serialized'
  return { ...usedKey, state: resState }
}

export const autoSetUsedKeys = createAsyncThunk(
  "flow/fetchAutoSetUsedKeys",
  async ({ sourceId, targetId }, { getState }) => {
    try {
      const dataTree = getState().FlowSlice.dataTree;
      const childrenIds = getAllChildrenId(dataTree, targetId).concat(targetId);
      let dataLinksByTypes = collectAvailableDataLinksByTypes(dataTree, sourceId)
      const sourceNode = dataTree[targetId].parents.find(parent => parent.id == sourceId)
      const sourceNodeDataLinks = getOutputDataLinksByTypes(dataTree, sourceNode.id)
      dataLinksByTypes = concatDataLinksByTypes(dataLinksByTypes, sourceNodeDataLinks)
      const chooseUsedKeys = autoChooseDataLink(dataTree, childrenIds, dataLinksByTypes);
      const newUsedKeys = Object.keys(chooseUsedKeys).map(key => {
        const nodeId = chooseUsedKeys[key].nodeId
        const usedKeys = chooseUsedKeys[key].usedKeys.map(usedKey => addStateToUsedKey(usedKey, 'connected'))
        return { nodeId, 'usedKeys': usedKeys }
      })
      console.log(newUsedKeys);
      await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/flow/node/used-keys/set`,
        { newUsedKeys },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );

      return { newUsedKeys };
    } catch (e) {
      console.log(e);
    }
  }
);

export const updateUsedKeys = createAsyncThunk(
  "flow/fetchUpdateUsedKeys",
  async ({ id, usedKeys }) => {
    console.log(usedKeys);
    try {
      await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/flow/node/${id}/used-keys`,
        { usedKeys },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );

      return { id, usedKeys };
    } catch (e) {
      console.log(e);
    }
  }
);

export const updateOutputKeys = createAsyncThunk(
  "flow/fetchUpdateOutputKeys",
  async ({ id, outputKeys }) => {
    try {
      await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/flow/node/${id}/output-key-names`,
        { outputKeys },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );

      return { id, outputKeys };
    } catch (e) {
      console.log(e);
    }
  }
);

export const renameUsedKeys = createAsyncThunk(
  "flow/fetchRenameUsedKeys",
  async ({ nodeIds, links, name }) => {
    try {
      await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/flow/node/used-keys/rename`,
        { nodeIds, links, name },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );

      return { nodeIds, links, name };
    } catch (e) {
      console.log(e);
    }
  }
);

export const changeUsedKeysState = createAsyncThunk(
  "flow/fetchChangeUsedKeysState",
  async ({ nodeIds, links, state }) => {
    try {
      await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/flow/node/used-keys/change-state`,
        { nodeIds, links, state },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );

      return { nodeIds, links, state };
    } catch (e) {
      console.log(e);
    }
  }
);

export const detachUsedKeys = createAsyncThunk(
  "flow/fetchDetachUsedKeys",
  async ({ sourceId, targetId }, { getState }) => {
    try {
      const dataTree = getState().FlowSlice.dataTree;
      const childrenId = getAllChildrenId(dataTree, targetId).concat(targetId);
      let links = collectAvailableDataLinks(dataTree, sourceId)
      const sourceNode = dataTree[targetId].parents.find(parent => parent.id == sourceId)
      links = links.concat(getOutputDataLinks(dataTree, sourceNode.id))
      await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/flow/node/used-keys/change-state`,
        { nodeIds: childrenId, links: links, state: 'disconnected' },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );

      return { nodeIds: childrenId, links, state: 'disconnected' };
    } catch (e) {
      console.log(e);
    }
  }
);

export const deleteEdge = createAsyncThunk(
  "flow/fetchDeleteEdge",
  async ({ edge }) => {
    try {
      await axios.delete(
        `${process.env.React_App_SERVER_URL}/api/flow/edge?id=${edge.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );

      return { edge };
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

export const deleteEdgeByNodeIdAndKey = createAsyncThunk(
  "flow/fetchDeleteEdgeByNodeIdAndKey",
  async ({ id, key }) => {
    try {
      const response = await axios.delete(
        `${process.env.React_App_SERVER_URL}/api/flow/edge?nodeId=${id}&key=${key}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );

      return { id: id, key: key, data: response.data };
    } catch (e) {
      console.log(e.response.data.message);
    }
  }
);

const FlowSlice = createSlice({
  name: "reactFlow",
  initialState: {
    flowId: "",
    viewportPosition: {},
    page: {},
    nodes: [],
    edges: [],
    dataTree: {},
    isLoaded: false,
    // сonnectionRules: [],
  },
  extraReducers: {
    [loadFlow.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { id, nodes, edges, viewportPosition, page } = action?.payload?.flow;
      if (!id || !nodes || !edges) return;
      const adoptedNpdes = [];
      const adoptedEdges = [];

      nodes.forEach((node) => {
        const adoptedNode = {
          id: node._id,
          type: node.moduleId,
          dragHandle: '.custom-drag-handle',
          data: {
            privateData: {
              moduleId: node.moduleId,
              flowId: node.flowId,
              outputKeys: node.outputKeys,
              usedKeys: node.usedKeys,
              handles: node.handles
            },
            publicData: node.data,
          },
          position: node.position,
        };
        adoptedNpdes.push(adoptedNode);
      });

      edges.forEach((edge) => {
        const adoptedEdge = {
          id: edge._id,
          source: edge.source,
          target: edge.target,
          data: { flowId: edge.flowId },
          sourceHandle: edge.sourceKey,
          targetHandle: edge.targetKey,
        };
        adoptedEdges.push(adoptedEdge);
      });
      state.flowId = id;
      state.viewportPosition = viewportPosition
      state.page = page
      state.nodes = adoptedNpdes;
      state.edges = adoptedEdges;
      state.dataTree = buildTree(nodes, edges);
      state.isLoaded = true
    },
    [saveViewportPosition.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { x, y, zoom } = action?.payload;
      state.viewportPosition = { x, y, zoom }
    },
    [addNode.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { node, data } = action?.payload;
      if (!node || !data.id) return;
      const newNode = { ...node }
      newNode.id = data.id
      newNode.outputKeys = node.data.privateData.outputKeys
      state.nodes.push(newNode);
      const inputs = moduleDataTypes[node.data.privateData.moduleId].inputs
      const usedKeys = inputs.map(input => ({ 'inputKey': input.key, 'type': input.type }))
      state.dataTree[data.id] = {
        outputKeys: node.data.privateData.outputKeys,
        usedKeys: usedKeys,
        moduleId: node.data.privateData.moduleId,
        handles: moduleDefaultHandles[node.data.privateData.moduleId],
        parents: [],
        children: [],
        new: true
      }
    },
    [deleteNode.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { id } = action?.payload;
      if (!id) return;
      state.nodes = state.nodes.filter((node) => node.id !== id);
    },
    [changePublicNodeData.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { node, id } = action?.payload;
      if (!id || !node) return;
      const existNode = state.nodes.find((node) => node.id === id);
      if (!existNode) return;
      existNode.data.publicData = node.data;
    },
    [addEdge.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { edge, data } = action?.payload;
      if (!data.id || !edge) return;
      edge.id = data.id;
      state.edges.push(edge);
      const target = state.dataTree[edge.target]
      const source = state.dataTree[edge.source]
      target.parents.push({
        id: edge.source,
        sourceKey: edge.sourceHandle,
      })
      source.children.push({
        id: edge.target,
      });
    },
    [autoSetUsedKeys.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { newUsedKeys } = action?.payload;

      newUsedKeys.forEach(update => {
        const node = state.dataTree[update.nodeId]
        node.usedKeys = update.usedKeys
        node.new = false
      })
    },
    [updateUsedKeys.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { id, usedKeys } = action?.payload;
      const node = state.dataTree[id]
      node.usedKeys = usedKeys
      node.new = false
    },
    [updateOutputKeys.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { id, outputKeys } = action?.payload;
      const node = state.dataTree[id]
      node.outputKeys = outputKeys
    },
    [changeUsedKeysState.fulfilled]: (botState, action) => {
      if (!action?.payload) return;
      const { nodeIds, links, state } = action?.payload;
      nodeIds.forEach(childid => {
        const node = botState.dataTree[childid]
        const newUsedKeys = node.usedKeys.map(usedKey => {
          if (links.find(dataLink => dataLink === usedKey.link))
            return { ...usedKey, state }
          return usedKey
        })
        node.usedKeys = newUsedKeys
      })
    },
    [detachUsedKeys.fulfilled]: (botState, action) => {
      if (!action?.payload) return;
      const { nodeIds, links, state } = action?.payload;
      nodeIds.forEach(childid => {
        const node = botState.dataTree[childid]
        const newUsedKeys = node.usedKeys.map(usedKey => {
          if (links.find(dataLink => dataLink === usedKey.link))
            return { ...usedKey, state }
          return usedKey
        })
        node.usedKeys = newUsedKeys
      })
    },
    [renameUsedKeys.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { nodeIds, links, name } = action?.payload;
      nodeIds.forEach(childid => {
        const node = state.dataTree[childid]
        node.usedKeys.forEach(usedKey => {
          if (links.find(dataLink => dataLink === usedKey.link))
            usedKey.name = name
        })
      })
    },
    [deleteEdge.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { edge } = action?.payload;
      const oldEdge = edge;
      if (!oldEdge) return;
      state.edges = state.edges.filter((edge) => edge.id !== oldEdge.id);
      state.dataTree[oldEdge.target].parents = state.dataTree[oldEdge.target].parents
        .filter((parent) => parent.id !== oldEdge.source);
      state.dataTree[oldEdge.source].children = state.dataTree[oldEdge.source].children
        .filter((child) => child.id !== oldEdge.target);
    },
    [deleteEdgeByNodeIdAndKey.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { id, key } = action?.payload;
      if (!id || !key) return;

      const newEdges = state.edges.filter((edge) => {
        return (
          !(edge.source === id && edge.sourceHandle === key) &&
          !(edge.target === id && edge.targetHandle === key)
        );
      });
      state.edges = newEdges;
    },
  },
  reducers: {
    onNodesChange(state, action) {
      state.nodes = applyNodeChanges(action.payload.nodes, state.nodes);
    },
    onEdgesChange(state, action) {
      state.edges = applyEdgeChanges(action.payload.edges, state.edges);
    },
    resetFlowData(state, action) {
      state.nodes = [];
      state.edges = [];
    },
    changePrivateNodeData(state, action) {
      const nawPrivateData = action.payload?.nawPrivateData;
      const id = action.payload?.id;
      const node = state.nodes.find((node) => node.id === id);
      node.data.privateData = nawPrivateData;
    },
  },
});

export const {
  changePrivateNodeData,
  resetFlowData,
  onNodesChange,
  onEdgesChange,
  changeText,
} = FlowSlice.actions;

export default FlowSlice.reducer;

