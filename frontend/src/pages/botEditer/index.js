import React from "react";
import Window from "./Window";
import "reactflow/dist/style.css";
import { ReactFlowProvider } from "reactflow";
export default function BotEditer() {
  return (
    <div>
      <ReactFlowProvider>
        <Window />
      </ReactFlowProvider>
    </div>
  );
}
