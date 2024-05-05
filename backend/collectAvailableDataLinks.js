function collectAvailableDataOn(dataTree, startNodeId, targetKey) {
    const memo = {};

    function recurse(nodeId) {
        if (memo[nodeId]) {
            return memo[nodeId];
        }

        const node = dataTree[nodeId];
        if (!node || node.parents.length === 0) {
            memo[nodeId] = [];
            return [];
        }

        const dataFlows = node.parents.map(parent => {
            const previousDataFlows = recurse(parent.id);
            const parentDataFlow = b(dataTree, parent.id, previousDataFlows, parent.sourceKey);
            return parentDataFlow;
        });

        memo[nodeId] = dataFlows;
        return dataFlows;
    }

    if (!startNodeId) return {};

    const dataFlows = recurse(startNodeId);
    let dataFlow = {}
    if (dataFlows.length == 0) return dataFlow;
    if (dataFlows.length == 1)
        dataFlow = dataFlows[0]
    else {
        dataFlow = mergeLinkFlows(dataFlows, startNodeId, targetKey);
    }
    const dataLinksByTypes = flatDataFlow(dataFlow);
    return dataLinksByTypes;
}

function b(dataTree, nodeId, dataFlows, sourceKey) {
    const node = dataTree[nodeId];
    let dataFlow = [];

    if (dataFlows.length == 1) {
        dataFlow = [...dataFlows[0]]
    } else {
        dataFlow = mergeLinkFlows(dataFlows, nodeId, sourceKey);
    }
    const newDataLinksByTypes = getOutputDataLinksByTypes(dataTree, nodeId, sourceKey);
    if (isForkOrTrigger(node)) {
        addReferencePoint(dataFlow, nodeId, newDataLinksByTypes, sourceKey)
    } else if (dataFlow.length > 0) {
        addDataToDataFlow(dataFlow, newDataLinksByTypes)
    }
    return dataFlow
}

function mergeLinkFlows(dataFlows, mergedSourceKey, key) {
    if (dataFlows.length === 0 || dataFlows.every(referencePoints => referencePoints.length === 0)) {
        return [];
    }
    const commonObjects = [];
    let mergedData = {};

    const minLength = Math.min(...dataFlows.map(referencePoints => referencePoints.length));
    const lastCommonIndex = findLastCommonIndex(dataFlows)

    for (let i = 0; i < minLength; i++) {
        const currentItems = dataFlows.map(referencePoints => referencePoints[i]);

        if (i <= lastCommonIndex) {
            if (i == lastCommonIndex) {
                commonObjects.push(currentItems.reduce((acc, item) => {
                    const data = concatDataLinksByTypes(acc.data, item.data)
                    return getReferencePoint(item.id, item.sourceKey, data)
                }, getReferencePoint(mergedSourceKey, currentItems[0].sourceKey, {})));
            } else {
                commonObjects.push(getReferencePoint(currentItems[0].id, currentItems[0].sourceKey, currentItems[0].data));
            }
        } else {
            const commonKeys = findCommonKeys(currentItems);
            commonKeys.forEach(key => {
                mergedData[key] = mergedData[key] ?? currentItems[0].data[key];
            });
        }
    }
    const mergedDataObjects = [getReferencePoint(mergedSourceKey, key, mergedData)];

    return [...commonObjects, ...mergedDataObjects];
}

function getOutputDataLinksByTypes(dataTree, id, sourceKey) {
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

function getReferencePoint(id, sourceKey, data = {}) {
    return { id, sourceKey, link: `${id}_${sourceKey}`, data }
}

function isForkOrTrigger(node) {
    return node.handles.targets.length == 0 || node.handles.sources.length > 1;
}

function addReferencePoint(dataFlow, nodeId, data = {}, sourceKey) {
    dataFlow.push(getReferencePoint(nodeId, sourceKey, data))
}

function addDataToDataFlow(dataFlow, data) {
    const referencePoint = dataFlow[dataFlow.length - 1]
    referencePoint.data = concatDataLinksByTypes(referencePoint.data, data)
}

function findCommonKeys(items) {
    return items.map(item => Object.keys(item.data))
        .reduce((acc, keys) => acc.filter(key => keys.includes(key)));
}

function flatDataFlow(dataFlow) {
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

function getDataLink(id, sourceKey, outputKey, type, name) {
    return {
        'link': `${id}_${sourceKey}_${outputKey}`,
        'sourceId': id,
        'sourceKey': sourceKey,
        'outputKey': outputKey,
        'type': type,
        'name': name
    };
}

function concatDataLinksByTypes(oldDataLinksByTypes, newDataLinksByTypes) {
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

const moduleDataTypes = {
    "command": {
        "inputs": [],
        "outputs": [
            {
                "key": "message-id",
                "type": "message-id"
            },
            {
                "key": "chat-id",
                "type": "chat-id"
            },
            {
                "key": "telegram-id",
                "type": "telegram-id"
            },
            {
                "key": "date",
                "type": "date"
            }
        ]
    },
    "loger": {
        "inputs": [
            {
                "key": "data"
            }
        ],
        "outputs": []
    },
    "text": {
        "inputs": [],
        "outputs": [
            {
                "key": "text",
                "type": "text"
            }
        ]
    },
    "textMassage": {
        "inputs": [
            {
                "key": "chat-id",
                "type": "chat-id"
            }
        ],
        "outputs": []
    },
    "question": {
        "inputs": [
            {
                "key": "chat-id",
                "type": "chat-id"
            }
        ],
        "outputs": [
            {
                "key": "answer",
                "type": "text"
            }
        ]
    }
}

const dataTree = {
    "6629e078d96f403477e6e6b6": {
        "outputKeys": {
            "chat-id": {
                "name": "Chat",
                "inUse": true,
                "_id": "6629e078d96f403477e6e6b7"
            },
            "telegram-id": {
                "name": "User",
                "inUse": true,
                "_id": "6629e078d96f403477e6e6b8"
            },
            "message-id": {
                "name": "Command message",
                "inUse": false,
                "_id": "6629e078d96f403477e6e6b9"
            },
            "date": {
                "name": "Date",
                "inUse": false,
                "_id": "6629e078d96f403477e6e6ba"
            }
        },
        "usedKeys": [],
        "moduleId": "command",
        "handles": {
            "targets": [],
            "sources": [
                "main-source"
            ]
        },
        "parents": [],
        "children": [
            {
                "id": "6629e07ad96f403477e6e6bf",
                "targetKey": "target"
            },
            {
                "id": "6629e07bd96f403477e6e6c6",
                "targetKey": "target"
            }
        ],
        "new": true
    },
    "6629e07ad96f403477e6e6bf": {
        "outputKeys": {
            "answer": {
                "name": "Answer",
                "inUse": true,
                "_id": "6629e07ad96f403477e6e6c0"
            }
        },
        "usedKeys": [
            {
                "inputKey": "chat-id",
                "state": "connected",
                "type": "chat-id",
                "sourceId": "6629e078d96f403477e6e6b6",
                "name": "Chat",
                "outputKey": "chat-id",
                "link": "6629e078d96f403477e6e6b6_undefined_chat-id",
                "_id": "6629e080d96f403477e6e6d7"
            }
        ],
        "moduleId": "question",
        "handles": {
            "targets": [
                "target"
            ],
            "sources": [
                "main-source",
                "keyboard_0000"
            ]
        },
        "parents": [
            {
                "id": "6629e078d96f403477e6e6b6",
                "sourceKey": "main-source"
            }
        ],
        "children": [
            {
                "id": "6629e07fd96f403477e6e6cd",
                "targetKey": "target"
            }
        ],
        "new": false
    },
    "6629e07bd96f403477e6e6c6": {
        "outputKeys": {
            "answer": {
                "name": "Answer",
                "inUse": true,
                "_id": "6629e07bd96f403477e6e6c7"
            }
        },
        "usedKeys": [
            {
                "inputKey": "chat-id",
                "state": "connected",
                "type": "chat-id",
                "sourceId": "6629e078d96f403477e6e6b6",
                "name": "Chat",
                "outputKey": "chat-id",
                "link": "6629e078d96f403477e6e6b6_undefined_chat-id",
                "_id": "6629e082d96f403477e6e6e0"
            }
        ],
        "moduleId": "question",
        "handles": {
            "targets": [
                "target"
            ],
            "sources": [
                "main-source",
                "keyboard_0000"
            ]
        },
        "parents": [
            {
                "id": "6629e078d96f403477e6e6b6",
                "sourceKey": "main-source"
            }
        ],
        "children": [
            {
                "id": "6629e07fd96f403477e6e6cd",
                "targetKey": "target"
            }
        ],
        "new": false
    },
    "6629e07fd96f403477e6e6cd": {
        "outputKeys": {},
        "usedKeys": [
            {
                "inputKey": "chat-id",
                "state": "connected",
                "type": "chat-id",
                "sourceId": "6629e078d96f403477e6e6b6",
                "name": "Chat",
                "outputKey": "chat-id",
                "link": "6629e078d96f403477e6e6b6_main-source_chat-id",
                "_id": "6629e084d96f403477e6e6f2"
            }
        ],
        "moduleId": "textMassage",
        "handles": {
            "targets": [
                "target"
            ],
            "sources": [
                "main-source"
            ]
        },
        "parents": [
            {
                "id": "6629e07bd96f403477e6e6c6",
                "sourceKey": "main-source"
            },
            {
                "id": "6629e07ad96f403477e6e6bf",
                "sourceKey": "keyboard_0000"
            }
        ],
        "children": [],
        "new": false
    }
}

function extractLinks(data) {
    let links = [];
    for (let outerKey in data) {
        if (data.hasOwnProperty(outerKey)) {
            let subObject = data[outerKey];
            for (let innerKey in subObject) {
                if (subObject.hasOwnProperty(innerKey)) {
                    let property = subObject[innerKey];
                    links.push(property.link);
                }
            }
        }
    }
    return links;
}

function collectAvailableLinksOn(dataTree, startNodeId, targetKey) {
    return extractLinks(collectAvailableDataOn(dataTree, startNodeId, targetKey));
}


console.log(collectAvailableLinksOn(dataTree, '6629e07fd96f403477e6e6cd', 'target'));