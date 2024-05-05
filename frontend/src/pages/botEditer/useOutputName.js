import { useState, useEffect } from 'react';
import { updateOutputKeys, updateChildren } from '../../store/FlowAsyncThunks';
import moduleDataTypes from "./moduleDataTypes";
import { useSelector, useDispatch } from "react-redux";

function useOutputName(id, outputKey) {
  const dispatch = useDispatch()
  const [name, setDataName] = useState('');
  const [inUse, setDatInUse] = useState(false);
  const dataTree = useSelector((state) => state.FlowSlice.dataTree);

  const setName = async (name) => {
    const node = dataTree[id]
    if (!moduleDataTypes[node.moduleId].outputs.find(output => output.key == outputKey)) return

    const newoutputKeys = { ...node.outputKeys };
    newoutputKeys[outputKey] = { name, inUse }
    await dispatch(updateOutputKeys({ id, outputKeys: newoutputKeys }))
    dispatch(updateChildren({ nodeId: id }))
  }

  const setInUse = async (inUse) => {
    const node = dataTree[id]
    if (!moduleDataTypes[node.moduleId].outputs.find(output => output.key == outputKey)) return

    const newoutputKeys = { ...node.outputKeys };
    newoutputKeys[outputKey] = { name, inUse }
    await dispatch(updateOutputKeys({ id, outputKeys: newoutputKeys }))
    dispatch(updateChildren({ nodeId: id }))
  }

  useEffect(() => {
    const node = dataTree[id]
    const outputKeys = node.outputKeys;
    if (!outputKey) return;
    setDataName(outputKeys[outputKey].name || '')
    setDatInUse(outputKeys[outputKey].inUse || false)
  }, [dataTree, id, outputKey]);

  return [name, setInUse, inUse, setName];
}


export default useOutputName



