const textDefaultData = { 'text': '' }

const textTypes = {
  inputs: [],
  outputs: [
    {
      key: 'text',
      type: 'text',
    }
  ],
}

const textDefaultHandles = {
  targets: [
    'target'
  ],
  sources: [
    'main-source',
  ],
}

const textDefaultOutputKeys = {
  'text': { 'name': 'Text', 'inUse': true }
}

export {
  textDefaultOutputKeys,
  textDefaultData,
  textDefaultHandles,
  textTypes
};