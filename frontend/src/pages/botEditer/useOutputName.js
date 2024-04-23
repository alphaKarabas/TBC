import { useState, useEffect } from 'react';
import { updateOutputKeys, renameUsedKeys, getAllChildrenId, changeUsedKeysState } from '../../store/FlowSlice';
import moduleDataTypes from "./moduleDataTypes";
import { useSelector, useDispatch } from "react-redux";

function useOutputName(id, outputKey) {
  const dispatch = useDispatch()
  const [name, setDataName] = useState('');
  const [inUse, setDatInUse] = useState(false);
  const dataTree = useSelector((state) => state.FlowSlice.dataTree);

  const setName = (name) => {
    const node = dataTree[id]
    if (!moduleDataTypes[node.moduleId].outputs.find(output => output.key == outputKey)) return

    const newoutputKeys = { ...node.outputKeys };
    newoutputKeys[outputKey] = { name, inUse }
    dispatch(updateOutputKeys({ id, outputKeys: newoutputKeys }))

    const childrenId = getAllChildrenId(dataTree, id);
    dispatch(renameUsedKeys({ nodeIds: childrenId, links:[`${id}_${outputKey}`], name }))
  }

  const setInUse = (inUse) => {
    const node = dataTree[id]
    if (!moduleDataTypes[node.moduleId].outputs.find(output => output.key == outputKey)) return

    const newoutputKeys = { ...node.outputKeys };
    newoutputKeys[outputKey] = { name, inUse }
    dispatch(updateOutputKeys({ id, outputKeys: newoutputKeys }))
    const childrenId = getAllChildrenId(dataTree, id);
    if (inUse) {
      dispatch(changeUsedKeysState({ 
        nodeIds: childrenId,
        links: [`${id}_${outputKey}`],
        state: 'connected'
      }))
    } else {
      dispatch(changeUsedKeysState({ 
        nodeIds: childrenId,
        links: [`${id}_${outputKey}`],
        state: 'disconnected'
      }))
    }
  }

  useEffect(() => {
    console.log('useOutputName', id);
    const node = dataTree[id]
    const outputKeys = node.outputKeys;
    if (!outputKey) return;
    setDataName(outputKeys[outputKey].name || '')
    setDatInUse(outputKeys[outputKey].inUse || false)
  }, [dataTree, id, outputKey]);

  return [name, setInUse, inUse, setName];
}


export default useOutputName



