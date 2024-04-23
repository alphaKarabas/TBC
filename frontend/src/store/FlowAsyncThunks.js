import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getConnectUpdates, getDisconnectUpdate } from "../dataTreeMethods";
import moduleDataTypes from "../pages/botEditer/moduleDataTypes";
import moduleDefaultHandles from "../pages/botEditer/moduleDefaultHandles";

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

export const updateConnect = createAsyncThunk(
  "flow/fetchUpdateConnect",
  async ({ sourceId, targetId }, { getState }) => {
    try {
      const dataTree = getState().FlowSlice.dataTree;
      const updates = getConnectUpdates(dataTree, sourceId, targetId)
      console.log(updates);
      await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/flow/node/used-keys/set`,
        { updates },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );

      return { updates };
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

export const updateDisconnect = createAsyncThunk(
  "flow/fetchupdateDisconnect",
  async ({ sourceId, targetId }, { getState }) => {
    try {
      const dataTree = getState().FlowSlice.dataTree;
      const update = getDisconnectUpdate(dataTree, sourceId, targetId)
      await axios.patch(
        `${process.env.React_App_SERVER_URL}/api/flow/node/used-keys/change-state`,
        update,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("JWT_Token")}`,
          },
        }
      );

      return update;
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