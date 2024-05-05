import React, { useState } from "react";
import { Position, Handle } from "reactflow";
import useAutoSave from '../useAutoSave';
import OutputDataName from './tools/OutputDataName';

function CommandNodeType({ data }) {
  return (
    <div>
      <div style={{ width: '200px' }}
      >{data.telegramCommand}</div>
      <Handle
        key="main-source"
        type="source"
        title="Session \n\tWill give a session"
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

function CommandSidebar({ id, data }) {
  const [node_data, setData] = useAutoSave(id, data);

  return (
    <div>
      <section>
        <h4>Command</h4>
        <input
          name="text"
          value={node_data.telegramCommand}
          onChange={(e) => {
            const newData = { telegramCommand: e.target.value }
            setData(newData);
          }}
        />
      </section>
      <hr />
      <section>
        <h4>Outputs</h4>
        <div>Test<OutputDataName id={id} outputKey='chat-id' /></div>
        <div>Chat id<OutputDataName id={id} outputKey='telegram-id' /></div>
        <div>Message<OutputDataName id={id} outputKey='message-id' /></div>
        <div>Date<OutputDataName id={id} outputKey='date' /></div>
      </section>
      <hr />
    </div>
  );
}

export {
  CommandNodeType,
  CommandSidebar,
};
