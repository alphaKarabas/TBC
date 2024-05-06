import { NodeProvider, useNodeActions } from "./NodeProvider.js";
import { useDispatch } from "react-redux";
import {
  setSelectedNodeId
} from "../store/FlowSlice.js";

const NodeTypeContainer = ({ NodeType, data, nodeInfo }) => {
  const dispatch = useDispatch();

  const onClick = () => {
    dispatch(setSelectedNodeId({ nodeId: nodeInfo.id }))
  }

  const { deleteNode } = useNodeActions();
  return (
    <div className="node">
      <div
        className="custom-drag-handle"
        style={{
          display: "flex",
          justifyContent: "end",
          marginBottom: "5px",
        }}
      >
        <span style={{ fontSize: "10px", fontWeight: "700", marginRight: "auto" }}>
          {data?.privateData?.moduleId}
        </span>
        <button
          style={{
            borderRadius: "100%",
            width: "14px",
            height: "14px",
            backgroundColor: "#ff5454",
          }}
          onClick={() => deleteNode()}
        ></button>
      </div>
      <div onClick={onClick}>
        <NodeType id={nodeInfo.id} data={data.publicData} nodeInfo={nodeInfo} />
      </div>
    </div>
  );
};

const wrapeNodeType = (NodeType) => {
  return ({ data, ...nodeInfo }) => {
    return (
      <NodeProvider id={nodeInfo.id}>
        <NodeTypeContainer NodeType={NodeType} data={data} nodeInfo={nodeInfo} />
      </NodeProvider>
    );
  };
};

export default wrapeNodeType;
