import React, { createContext, useContext } from 'react';
import { useDispatch } from "react-redux";
import {
    changePublicNodeData,
    deleteEdgeByNodeIdAndKey,
    deleteNode,
  } from "../../store/FlowSlice.js";

const NodeContext = createContext(null);

const NodeProvider = ({ children, id, node }) => {
    const dispatch = useDispatch();
// console.log(node);
    const saveData = (data) => 
        dispatch(changePublicNodeData({ id, data }));

    const deleteSelf = () => 
        dispatch(deleteNode({ id }));

    const removEdges = async (key) => {
        await dispatch(deleteEdgeByNodeIdAndKey({ id, key })).unwrap();
    };

    const value = {
        saveData,
        deleteNode: deleteSelf,
        removEdges,
    };

    return <NodeContext.Provider value={value}>{children}</NodeContext.Provider>;
};

const useNodeActions = () => useContext(NodeContext);

export {NodeProvider, useNodeActions}
