import moduleDataTypes from "../moduleInfo/dataTypes"

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
            edgeId: edge._id,
            id: edge.source,
            sourceKey: edge.sourceKey
        });

        source.children.push({
            edgeId: edge._id,
            id: edge.target,
            targetKey: edge.targetKey
        });
    });

    return tree;
}

export function getOutputDataLinksByTypes(dataTree, id, sourceKey) {
    let dataLinksByTypes = {};

    const nodeData = dataTree[id];
    if (!nodeData) return;

    const outputDataTypes = moduleDataTypes[nodeData.moduleId].outputs;

    outputDataTypes.forEach(outputDataType => {
        const key = outputDataType.key;
        const typeKey = outputDataType.type;

        if (!nodeData.outputKeys[key].inUse) return;
        if (!dataLinksByTypes[typeKey]) dataLinksByTypes[typeKey] = {};

        dataLinksByTypes[typeKey][nodeData.outputKeys[key].name] =
            getDataLink(id, sourceKey, key, typeKey, nodeData.outputKeys[key].name);
    });

    return dataLinksByTypes
}

export function getDataLink(id, sourceKey, outputKey, type, name) {
    return {
        'link': `${id}_${sourceKey}_${outputKey}`,
        'sourceId': id,
        'sourceKey': sourceKey,
        'outputKey': outputKey,
        'type': type,
        'name': name
    };
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

export function isForkOrTrigger(node) {
    return node.handles.targets.length == 0 || node.handles.sources.length > 1;
}

function findLastCommonIndex(arrays) {
    let lastIndex = -1;
    let minLength = Math.min(...arrays.map(arr => arr.length));

    for (let i = 0; i < minLength; i++) {
        let currentKeys = arrays.map(arr => arr[i].link);

        if (currentKeys.every(key => key === currentKeys[0])) {
            lastIndex = i;
        } else {
            break;
        }
    }

    return lastIndex;
}

function hasCommonData(type, name, dataList) {
    return dataList.every(obj => !!obj[type] && name in obj[type]);
}

function intersectData(dataList) {
    if (dataList?.length == 0) return {}
    const newObject = {}
    const baseData = dataList[0]
    for (const type of Object.keys(baseData)) {
        for (const name of Object.keys(baseData[type])) {
            if (hasCommonData(type, name, dataList))
                if (!newObject[type]) newObject[type] = { [name]: baseData[type][name] }
                else newObject[type][name] = baseData[type][name]
        }
    }

    return newObject;
}

function mergeData(dataList) {
    if (dataList?.length == 0) return {}
    const types = [...new Set(dataList.map(data => Object.keys(data)).flat())]
    const data = {}
    types.forEach(type => {
        const dataByType = {}
        dataList.forEach(data => {
            if (!data[type]) return;
            Object.keys(data[type]).forEach(name => {
                if (!dataByType[name]) dataByType[name] = data[type][name]
            })
        })
        data[type] = dataByType
    })

    return data;
}

function mergeDataFlows(dataFlows, mergedSourceKey) {
    if (dataFlows.length == 1) return [...dataFlows[0]];
    if (dataFlows.length == 0 || dataFlows.every(referencePoints => referencePoints.length == 0)) return [];
    const commonObjects = [];
    let mergedData = {};

    const minLength = Math.min(...dataFlows.map(referencePoints => referencePoints.length));
    const lastCommonIndex = findLastCommonIndex(dataFlows)
    for (let i = 0; i < minLength; i++) {
        const referencePoints = dataFlows.map(referencePoints => referencePoints[i]);
        if (i <= lastCommonIndex) {
            const firstRP = referencePoints[0]
            if (i == lastCommonIndex) {
                commonObjects.push(referencePoints.reduce((acc, item) => {
                    const data = concatDataLinksByTypes(acc.data, item.data)
                    return getReferencePoint(item.id, item.sourceKey, data)
                }, getReferencePoint(mergedSourceKey, firstRP.sourceKey, {})));
            } else {

                commonObjects.push(getReferencePoint(firstRP.id, firstRP.sourceKey, firstRP.data));
            }
        } else {
            const dataLinksByTypesList = referencePoints.map(item => item.data)
            mergedData = mergeData([intersectData(dataLinksByTypesList), mergedData])
        }
    }

    const mergedDataObjects = Object.keys(mergedData).length > 0 ?
        [getReferencePoint(mergedSourceKey, 'target', mergedData)] : [];

    return [...commonObjects, ...mergedDataObjects];
}

function findCommonKeys(items) {
    return items.map(item => Object.keys(item.data))
        .reduce((acc, keys) => acc.filter(key => keys.includes(key)));
}

function getReferencePoint(id, sourceKey, data = {}) {
    return { id, sourceKey, link: `${id}_${sourceKey}`, data }
}

function addReferencePoint(dataFlow, nodeId, data = {}, sourceKey) {
    dataFlow.push(getReferencePoint(nodeId, sourceKey, data))
}

function addDataToDataFlow(dataFlow, data) {
    const referencePoint = dataFlow[dataFlow.length - 1]
    referencePoint.data = concatDataLinksByTypes(referencePoint.data, data)
}

export function flatDataFlow(dataFlow) {
    const dataLinksByTypes = dataFlow.reduce((acc, item) => {
        const data = JSON.parse(JSON.stringify(item.data))
        Object.keys(data).forEach(type => {
            let byNames = data[type];
            Object.keys(byNames).forEach(name => {
                const dataLink = byNames[name]
                byNames[name] = getDataLink(item.id, item.sourceKey, dataLink.outputKey, dataLink.type, dataLink.name)
            });
        });
        return concatDataLinksByTypes(acc, data)
    }, {})

    return dataLinksByTypes
}

export function loadNodeToFlow(dataTree, dataFlow, nodeId, sourceKey) {
    const newDataLinksByTypes = getOutputDataLinksByTypes(dataTree, nodeId, sourceKey);
    if (isForkOrTrigger(dataTree[nodeId])) {
        addReferencePoint(dataFlow, nodeId, newDataLinksByTypes, sourceKey)
    } else if (dataFlow.length > 0) {
        addDataToDataFlow(dataFlow, newDataLinksByTypes)
    }
    return dataFlow
}

export function collectInputFlows(dataTree, startNodeId, dataMemo = {}, traceMemo = {}) {
    function recurse(nodeId) {
        const node = dataTree[nodeId];
        console.log(node);

        const flows = node.parents.map(parent => {
            if (dataMemo[parent.id]) {
                return dataMemo[parent.id];
            }
            const flows = recurse(parent.id);
            console.log(flows);
            const previousParentsFlow = mergeDataFlows(flows, parent.id);
            const parentFlow = loadNodeToFlow(dataTree, previousParentsFlow, parent.id, parent.sourceKey)

            dataMemo[parent.id] = { edgeId: parent.edgeId, flow: parentFlow };
            return parentFlow;
        });

        return flows;
    }

    if (!startNodeId) return {};

    const flows = recurse(startNodeId);
    return flows
}

export function getFlow(dataFlow) {
    const edgeId = dataFlow.edgeId
    const flow = dataFlow.flow.map(referencePoint => {
        return {
            edgeId,
            nodeId: referencePoint.id,
            sourceKey: referencePoint.sourceKey
        }
    })
    return { edgeId, flow };

}

export function collectAvailableDataFrom(dataTree, startNodeId, sourceKey, dataMemo) {
    if (!startNodeId) return {};
    const dataFlows = collectInputFlows(dataTree, startNodeId, dataMemo)
    if (dataFlows.length == 0) return {};
    const previousDataFlows = mergeDataFlows(dataFlows, startNodeId);
    const dataFlow = loadNodeToFlow(dataTree, previousDataFlows, startNodeId, sourceKey)
    const dataLinksByTypes = flatDataFlow(dataFlow);
    return dataLinksByTypes;
}

export function collectAvailableDataOn(dataTree, startNodeId, dataMemo) {
    if (!startNodeId) return {};
    const dataFlows = collectInputFlows(dataTree, startNodeId, dataMemo)
    let dataFlow = {}
    if (dataFlows.length == 0) return {};
    if (dataFlows.length == 1) {
        dataFlow = dataFlows[0]
    } else {
        dataFlow = mergeDataFlows(dataFlows, startNodeId);
    }
    const dataLinksByTypes = flatDataFlow(dataFlow);
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

export function addStateToUsedKey(usedKey, state) {
    const resState = usedKey.type ? state : 'serialized'
    return { ...usedKey, state: resState }
}

export function autoChooseDataLink(dataTree, id, dataLinksByTypes) {
    const node = dataTree[id]
    const usedKeys = node.usedKeys.map(usedKey => {
        if (!dataLinksByTypes[usedKey.type]) {
            return usedKey
        }
        const newUsedKey = { ...chooseDataLink(dataLinksByTypes[usedKey.type]), ...usedKey }
        return addStateToUsedKey(newUsedKey, 'connected')
    })
    return usedKeys
}

export function updateDataLinks(dataTree, id, dataLinksByTypes) {
    const node = dataTree[id]
    const usedKeys = node.usedKeys.map(usedKey => {
        const variants = dataLinksByTypes[usedKey.type]
        if (variants) {
            const linkName = Object.keys(variants).find(name => variants[name].link === usedKey.link)
            if (linkName) {
                const newUsedKey = { ...usedKey, name: linkName }
                return addStateToUsedKey(newUsedKey, 'connected')
            } else if (variants && variants[usedKey.name]) {
                const newUsedKey = { ...variants[usedKey.name], inputKey: usedKey.inputKey }
                return addStateToUsedKey(newUsedKey, 'connected')
            }
        } else {
            return addStateToUsedKey(usedKey, 'disconnected')
        }
    })
    return usedKeys
}

export function getBranchUpdate(dataTree, rootId) {
    if (!rootId) return {};
    const dataMemo = {};
    const updates = [];
    const data = collectAvailableDataOn(dataTree, rootId, dataMemo)
    const usedKeysUpdate = dataTree[rootId].new ?
        autoChooseDataLink(dataTree, rootId, data) :
        updateDataLinks(dataTree, rootId, data);
    updates.push({ nodeId: rootId, usedKeys: usedKeysUpdate })
    const childrenUpdates = getChildrenUpdate(dataTree, rootId, dataMemo)
    return {
        usedKeys: [...updates, ...childrenUpdates.usedKeys],
        flow: Object.values(dataMemo).map(flow => getFlow(flow))
    }
}

export function getChildrenUpdate(dataTree, rootId, dataMemo = {}) {
    if (!rootId) return {};
    const updates = [];

    function recurse(nodeId) {
        const node = dataTree[nodeId];
        if (!node || node.children.length === 0) return;

        node.children.forEach(child => {
            if (dataMemo[child.id]) return;
            const data = collectAvailableDataOn(dataTree, child.id, dataMemo)
            const usedKeysUpdate = updateDataLinks(dataTree, child.id, data);
            updates.push({ nodeId: child.id, usedKeys: usedKeysUpdate })
            recurse(child.id);
        });

    }

    recurse(rootId);
    return {
        usedKeys: updates,
        flow: Object.values(dataMemo).map(flow => getFlow(flow))
    }
}
