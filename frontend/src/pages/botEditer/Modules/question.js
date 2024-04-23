import React from "react";
import { Position, Handle } from "reactflow";
import useAutoSave from '../useAutoSave';
import DataKeySelector from './tools/DataKeySelector';
import OutputDataName from './tools/OutputDataName';

function QuestionNodeType({ data }) {
  return (
    <div>
      <div>{data.text}</div>
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

function QuestionSidebar({ id, data }) {
  const [keys, setKeys] = useAutoSave(id, data);
  const setKey = (key, value) => {
    const newKeys = { ...keys, [key]: value };
    setKeys(newKeys)
  }

  return (
    <div>
      <section>
      <h4>Text</h4>
        <textarea
          name="text"
          value={keys['text']}
          onChange={(e) => {
            setKey('text', e.target.value);
          }}
        />
      </section>
      <hr />
      <section>
        <h4>Inputs</h4>
        <div>Chat<DataKeySelector id={id} inputKey='chat-id' /></div>
      </section>
      <hr />
      <section>
        <h4>Outputs</h4>
        <div>Answer<OutputDataName id={id} outputKey='answer' /></div>
      </section>
      <hr />
    </div>
  );
}

export {
  QuestionNodeType,
  QuestionSidebar,
};