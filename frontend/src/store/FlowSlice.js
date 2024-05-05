import { createSlice } from "@reduxjs/toolkit";
import { applyEdgeChanges, applyNodeChanges } from "reactflow";
import moduleDataTypes from "../pages/botEditer/moduleDataTypes";
import moduleDefaultHandles from "../pages/botEditer/moduleDefaultHandles";
import { buildTree } from "../dataTreeMethods";
import * as FlowAsyncThunks from "./FlowAsyncThunks"

const FlowSlice = createSlice({
  name: "reactFlow",
  initialState: {
    flowId: "",
    selectedNodeId: null,
    viewportPosition: {},
    page: {},
    nodes: [],
    edges: [],
    dataTree: {},
    isLoaded: false,
    // сonnectionRules: [],
  },
  extraReducers: {
    [FlowAsyncThunks.loadFlow.fulfilled]: (state, action) => {
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
          data: { 
            flowId: edge.flowId
          },
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
    [FlowAsyncThunks.saveViewportPosition.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { x, y, zoom } = action?.payload;
      state.viewportPosition = { x, y, zoom }
    },
    [FlowAsyncThunks.addNode.fulfilled]: (state, action) => {
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
    [FlowAsyncThunks.deleteNode.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { id } = action?.payload;
      if (!id) return;
      state.nodes = state.nodes.filter((node) => node.id !== id);
      state.dataTree[id].parents.forEach(parent => {
        const parentNode = state.dataTree[parent.id]
        parentNode.children = parentNode.children.filter(child => child.id != id)
      })
      delete state.dataTree[id]
    },
    [FlowAsyncThunks.changePublicNodeData.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { node, id } = action?.payload;
      if (!id || !node) return;
      const existNode = state.nodes.find((node) => node.id === id);
      if (!existNode) return;
      existNode.data.publicData = node.data;
    },
    [FlowAsyncThunks.addEdge.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { edge, data } = action?.payload;
      if (!data.id || !edge) return;
      edge.id = data.id;
      state.edges.push(edge);
      const target = state.dataTree[edge.target]
      const source = state.dataTree[edge.source]
      target.parents.push({
        edgeId: edge._id,
        id: edge.source,
        sourceKey: edge.sourceKey,
      })
      source.children.push({
        edgeId: edge._id,
        id: edge.target,
        targetKey: edge.targetKey,
      });
    },
    [FlowAsyncThunks.updateUsedKeys.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { id, usedKeys } = action?.payload;
      const node = state.dataTree[id]
      node.usedKeys = usedKeys
      node.new = false
    },
    [FlowAsyncThunks.updateOutputKeys.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { id, outputKeys } = action?.payload;
      const node = state.dataTree[id]
      node.outputKeys = outputKeys
    },
    [FlowAsyncThunks.updateHandles.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { id, handles } = action?.payload;
      const node = state.dataTree[id]
      node.handles = handles
    },
    [FlowAsyncThunks.changeUsedKeysState.fulfilled]: (botState, action) => {
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
    [FlowAsyncThunks.updateBranch.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { usedKeys } = action?.payload;

      usedKeys.forEach(update => {
        const node = state.dataTree[update.nodeId]
        node.usedKeys = update.usedKeys
        node.new = false
      })
    },
    [FlowAsyncThunks.deleteEdge.fulfilled]: (state, action) => {
      if (!action?.payload) return;
      const { edge } = action?.payload;
      const oldEdge = edge;
      if (!oldEdge) return;
      state.edges = state.edges.filter((edge) => edge.id !== oldEdge.id);
      state.dataTree[oldEdge.target].parents = state.dataTree[oldEdge.target].parents
        .filter((parent) => parent.id !== oldEdge.source);
      state.dataTree[oldEdge.source].children = state.dataTree[oldEdge.source].children
        .filter((child) => child.id !== oldEdge.target);
      const target = state.dataTree[edge.target]
      const source = state.dataTree[edge.source]
      target.parents.filter(parent => parent.edgeId != oldEdge.id)
      source.children.filter(child => child.edgeId != oldEdge.id)
    },
    [FlowAsyncThunks.deleteEdgeByNodeIdAndKey.fulfilled]: (state, action) => {
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
    setSelectedNodeId(state, action) {
      state.selectedNodeId = action.payload.nodeId
    },
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
  setSelectedNodeId,
  changePrivateNodeData,
  resetFlowData,
  onNodesChange,
  onEdgesChange,
  changeText,
} = FlowSlice.actions;

export default FlowSlice.reducer;

