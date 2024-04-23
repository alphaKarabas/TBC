import moduleDataTypes from "./pages/botEditer/moduleDataTypes"

export function buildTree(nodes, edges) {
    const tree = {};

    nodes.forEach(node => {
        tree[node._id] = {
            outputKeys: node.outputKeys,
            usedKeys: node.usedKeys,
            moduleId: node.moduleId,
            handles: node.handles,
            parents: [],
            children: [],
            new: node.new
        };
    });

    edges.forEach(edge => {
        const target = tree[edge.target];
        const source = tree[edge.source];

        if (!target || !source) {
            console.error("Target or source not found for edge:", edge);
            return;
        }

        target.parents.push({
            id: edge.source,
            sourceKey: edge.sourceKey
        });

        source.children.push({
            id: edge.target,
            targetKey: edge.targetKey
        });
    });

    return tree;
}

export function getOutputDataLinksByTypes(dataTree, id) {
    let dataLinksByTypes = {};

    const nodeData = dataTree[id];
    if (!nodeData) return;
    console.log(dataTree);

    const outputDataTypes = moduleDataTypes[nodeData.moduleId].outputs;
    console.log(outputDataTypes);

    outputDataTypes.forEach(outputDataType => {
        const key = outputDataType.key;
        const typeKey = outputDataType.type;

        if (!nodeData.outputKeys[key].inUse) return;
        if (!dataLinksByTypes[typeKey]) dataLinksByTypes[typeKey] = {};

        dataLinksByTypes[typeKey][nodeData.outputKeys[key].name] = {
            'link': `${id}_${key}`,
            'sourceId': id,
            'outputKey': key,
            'type': typeKey,
            'name': nodeData.outputKeys[key].name
        };

    });

    return dataLinksByTypes
}

export function concatDataLinksByTypes(oldDataLinksByTypes, newDataLinksByTypes) {
    const dataLinksByTypes = { ...oldDataLinksByTypes }
    Object.keys(newDataLinksByTypes).forEach(type => {
        if (!dataLinksByTypes[type]) dataLinksByTypes[type] = {};
        dataLinksByTypes[type] = {
            ...dataLinksByTypes[type],
            ...newDataLinksByTypes[type]
        }
    })
    return dataLinksByTypes;
}

export function collectAvailableDataLinksByTypes(dataTree, startNodeId) {
    let dataLinksByTypes = {};
    function recurse(nodeId) {
        const node = dataTree[nodeId];
        if (!node || node.parents.length === 0) return;
        node.parents.forEach(parent => {
            recurse(parent.id);

            const newDataLinksByTypes = getOutputDataLinksByTypes(dataTree, parent.id);
            dataLinksByTypes = concatDataLinksByTypes(dataLinksByTypes, newDataLinksByTypes)
        });
    }

    if (startNodeId) {
        recurse(startNodeId);
    }

    return dataLinksByTypes;
}

export function getOutputDataLinks(dataTree, id) {
    const dataLinks = [];
    const nodeData = dataTree[id];
    if (!nodeData) return;
    const outputDataTypes = moduleDataTypes[nodeData.moduleId].outputs;

    outputDataTypes.forEach(outputDataType => {
        const key = outputDataType.key;
        dataLinks.push(`${id}_${key}`)
    });

    return dataLinks
}

export function collectAvailableDataLinks(dataTree, startNodeId) {
    let dataLinks = [];

    function recurse(nodeId) {
        const node = dataTree[nodeId];
        if (!node || node.parents.length === 0) return;

        node.parents.forEach(parent => {
            dataLinks = dataLinks.concat(getOutputDataLinks(dataTree, parent.id))
            recurse(parent.id);
        });
    }

    if (startNodeId) {
        recurse(startNodeId);
    }

    return dataLinks;
}

export function DataLinksByTypesToDataLinks(dataLinksByTypes) {
    const dataLinks = []
    Object.keys(dataLinksByTypes).map(type => {
        Object.keys(dataLinksByTypes[type]).map(name => {
            dataLinks.push({
                ...dataLinksByTypes[type][name],
                'name': name,
                'type': type
            })
        })
    })
    return dataLinks
}

function chooseDataLink(dataLinksByNames) {
    return dataLinksByNames[Object.keys(dataLinksByNames).pop()]
}

export function autoChooseDataLink(dataTree, nodsIds, dataLinksByTypes) {
    return nodsIds.map(id => {
        const node = dataTree[id]
        const usedKeys = node.usedKeys.map(usedKey => {
            if (usedKey.state == 'connected') return usedKey;
            if (!usedKey.type) return usedKey
            if (node.new)
                return { ...chooseDataLink(dataLinksByTypes[usedKey.type]), ...usedKey }
            if (dataLinksByTypes[usedKey.type] && dataLinksByTypes[usedKey.type][usedKey.name])
                return { ...dataLinksByTypes[usedKey.type][usedKey.name], ...usedKey }
            return usedKey
        })
        return { nodeId: id, usedKeys }
    })
}

export function getAllChildrenId(dataTree, startNodeId) {
    let childrenId = [];

    function recurse(nodeId) {
        const node = dataTree[nodeId];
        if (node?.children.length === 0) return;

        node.children.forEach(child => {
            childrenId.push(child.id)
            recurse(child.id);
        });
    }

    if (startNodeId) {
        recurse(startNodeId);
    }

    return childrenId;
}

function addStateToUsedKey(usedKey, state) {
    const resState = usedKey.type ? state : 'serialized'
    return { ...usedKey, state: resState }
}

export function getConnectUpdates(dataTree, sourceId, targetId) {
    const childrenIds = getAllChildrenId(dataTree, targetId).concat(targetId);
    let dataLinksByTypes = collectAvailableDataLinksByTypes(dataTree, sourceId)
    const sourceNode = dataTree[targetId].parents.find(parent => parent.id == sourceId)
    const sourceNodeDataLinks = getOutputDataLinksByTypes(dataTree, sourceNode.id)
    dataLinksByTypes = concatDataLinksByTypes(dataLinksByTypes, sourceNodeDataLinks)
    const chooseUsedKeys = autoChooseDataLink(dataTree, childrenIds, dataLinksByTypes);
    const update = Object.keys(chooseUsedKeys).map(key => {
        const nodeId = chooseUsedKeys[key].nodeId
        const usedKeys = chooseUsedKeys[key].usedKeys.map(usedKey => addStateToUsedKey(usedKey, 'connected'))
        return { nodeId, 'usedKeys': usedKeys }
    })
    return update
}

export function getDisconnectUpdate(dataTree, sourceId, targetId) {
    const childrenId = getAllChildrenId(dataTree, targetId).concat(targetId);
    let links = collectAvailableDataLinks(dataTree, sourceId)
    const sourceNode = dataTree[targetId].parents.find(parent => parent.id == sourceId)
    links = links.concat(getOutputDataLinks(dataTree, sourceNode.id))
    const update = { nodeIds: childrenId, links, state: 'disconnected' }
    return update
}
