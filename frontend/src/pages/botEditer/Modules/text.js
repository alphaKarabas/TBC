import React from "react";
import { Position, Handle } from "reactflow";
import useAutoSave from '../useAutoSave';
import OutputDataName from './tools/OutputDataName';

function TextNodeType({ data }) {
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

function TextSidebar({ id, data }) {
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
        <h4>Outputs</h4>
        <div>Text<OutputDataName id={id} outputKey='text' /></div>
      </section>
      <hr />
    </div>
  );
}

export {
  TextNodeType,
  TextSidebar,
};