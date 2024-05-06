import React from "react";
import { Position, Handle } from "reactflow";
import AnyDataKeySelector from '../moduleTools/AnyDataKeySelector';

function LogerNodeType() {
  return (
    <div>
      <Handle
        key="target"
        type="target"
        title="[4] Any data \n\trequired!"
        style={{
          backgroundColor: "#2a9666",
          width: "10px",
          height: "15px",
          borderRadius: "3px",
        }}
        position={Position.Left}
        id="target"
      />
      <Handle
        key="main-source"
        type="source"
        title="[2] Any data"
        style={{
          backgroundColor: "#38d991",
          width: "10px",
          height: "15px",
          borderRadius: "3px",
        }}
        position={Position.Right}
        id="main-source"
      />
    </div>
  );
}

function LogerSidebar({ id }) {
  return (
    <div>
      <section>
        <h4>Inputs</h4>
        <div>Loging data<AnyDataKeySelector id={id} inputKey='data' /></div>
      </section>
      <hr />
    </div>
  );
}

export {
  LogerNodeType,
  LogerSidebar,
};