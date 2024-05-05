import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactFlow, { useOnViewportChange } from "reactflow";
import { useSelector, useDispatch } from "react-redux";
import {
  deleteEdge,
  addEdge,
  addNode,
  loadFlow,
  savePosition,
  saveViewportPosition,
  updateBranch
} from "../../store/FlowAsyncThunks.js";
import {
  resetFlowData,
  onNodesChange,
  onEdgesChange,
} from "../../store/FlowSlice.js";
import "./index.css";
import moduleTypes from "./moduleTypes";
import moduleSidebars from "./moduleSidebars.js";
import moduleDefaultData from "./moduleDefaultData.js";
import moduleDefaultOutputKeys from "./moduleDefaultOutputKeys.js";
import SidebarWraper from "./SidebarWraper";
import NodeSections from "./NodeSections";
import { NodeProvider } from "./NodeProvider";

const Window = () => {
  const dispatch = useDispatch();
  const nodes = useSelector((state) => state.FlowSlice.nodes);
  const selectedNodeId = useSelector((state) => state.FlowSlice.selectedNodeId);
  const currentBotId = useSelector((state) => state.BotListSlice.currentBotId);
  const flowId = useSelector((state) => state.FlowSlice.flowId);
  const [selectedNode, setSelectedNode] = useState(null);
  const Sidebar = selectedNode ? moduleSidebars[selectedNode.data.privateData.moduleId] : null;

  useEffect(() => {
    if (selectedNodeId) {
      const node = nodes.find(node => node.id === selectedNodeId)
      setSelectedNode(node);
    } else {
      setSelectedNode(null);
    }
  }, [selectedNodeId, nodes]);

  const onDragStart = (event, moduleId) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({
        flowId,
        moduleId,
        type: moduleId,

      }));
    event.dataTransfer.effectAllowed = "move";
  };

  useEffect(() => {
    dispatch(loadFlow({ id: currentBotId, page: 1 }));
    return () => {
      dispatch(resetFlowData());
    };
  }, [dispatch, currentBotId]);

  return (
    <div style={{ height: "100vh", display: "flex" }}>
      <aside
        style={{ width: "248px", border: "1px solid #555", overflow: "auto" }}
      >
        <NodeSections onDragStart={onDragStart} />
      </aside>
      <Flow />
      {selectedNode &&
        <NodeProvider id={selectedNode.id} node={selectedNode}>
          <SidebarWraper key={selectedNode.id} Sidebar={Sidebar} node={selectedNode} />
        </NodeProvider>
      }
    </div>
  );
};

function Flow() {
  const nodes = useSelector((state) => state.FlowSlice.nodes);
  const edges = useSelector((state) => state.FlowSlice.edges);
  const isLoaded = useSelector((state) => state.FlowSlice.isLoaded);
  const dispatch = useDispatch();
  const edgeUpdateSuccessful = useRef(true);
  const flowId = useSelector((state) => state.FlowSlice.flowId);
  const viewportPosition = useSelector((state) => state.FlowSlice.viewportPosition);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  useOnViewportChange({
    onEnd: useCallback((viewport) => {
      const data = { id: flowId, ...viewport };
      dispatch(saveViewportPosition(data));
    }, [flowId]),
  });

  const onConnect = async (edge) => {
    const { payload } = await dispatch(addEdge({ flowId: flowId, edge: edge }));
    const newEdge = payload.edge;
    dispatch(updateBranch({ nodeId: newEdge.target, edgeId: newEdge._id }));
  };

  const onDisonnect = async (edge) => {
    const { payload } = await dispatch(deleteEdge({ edge }));
    const oldEdge = payload.edge;
    dispatch(updateBranch({ nodeId: oldEdge.target, edgeId: oldEdge.id }));
  };

  const onEdgeUpdateStart = () => {
    edgeUpdateSuccessful.current = false;
  };

  const onEdgeUpdate = async (oldEdge, newConnection) => {
    if (
      oldEdge.source !== newConnection.source ||
      oldEdge.target !== newConnection.target ||
      oldEdge.sourceHandle !== newConnection.sourceHandle ||
      oldEdge.targetHandle !== newConnection.targetHandle
    ) {
      onDisonnect(oldEdge);
    }
    edgeUpdateSuccessful.current = true;
  };

  const onEdgeUpdateEnd = async (_, edge) => {
    if (!edgeUpdateSuccessful.current) {
      onDisonnect(edge);
    }
    edgeUpdateSuccessful.current = true;
  };

  const onNodeDragStop = (_, node) => {
    dispatch(
      savePosition({
        id: node.id,
        xPos: node.position.x,
        yPos: node.position.y,
      })
    );
  };

  const reactFlowWrapper = useRef(null);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const data = JSON.parse(
        event.dataTransfer.getData("application/reactflow")
      );

      if (typeof data === "undefined" || !data) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const node = {
        data: {
          privateData: {
            flowId: data.flowId,
            moduleId: data.moduleId,
            isNew: true,
            outputKeys: moduleDefaultOutputKeys[data.moduleId],
            usedKeys: []
          },
          publicData: moduleDefaultData[data.moduleId]
        },
        dragHandle: ".custom-drag-handle",
        position: position,
        type: data.type,
      };

      dispatch(addNode({ node: node }));
    },
    [reactFlowInstance]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);
  return (
    <div style={{ height: "100vh", width: "100%", backgroundColor: "#363636" }}>
      {isLoaded && (<div
        style={{ height: "100vh", width: "100%" }}
        className="reactflow-wrapper"
        ref={reactFlowWrapper}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(nodes) => dispatch(onNodesChange({ nodes: nodes }))}
          onEdgesChange={(edges) => dispatch(onEdgesChange({ edges: edges }))}
          onEdgeDoubleClick={async (_, edge) => onDisonnect(edge)}
          onConnect={onConnect}
          onEdgeUpdate={onEdgeUpdate}
          onEdgeUpdateStart={onEdgeUpdateStart}
          onEdgeUpdateEnd={onEdgeUpdateEnd}
          onNodeDragStop={onNodeDragStop}
          onlyRenderVisibleElements={true}
          nodeTypes={moduleTypes}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          defaultViewport={viewportPosition}
          minZoom={0.2}
        ></ReactFlow>
      </div>)}
    </div>
  );
}

export default Window;
