const textMassageDefaultData = { 'text': '' }

const textMassageTypes = {
  inputs: [
    {
      key: 'chat-id',
      type: 'chat-id',
    }
  ],
  outputs: [],
}

const textMassageDefaultHandles = {
  targets: [
    'target'
  ],
  sources: [
    'main-source',
  ],
}

const textMassageDefaultOutputKeys = {}

export {
  textMassageDefaultOutputKeys,
  textMassageDefaultData,
  textMassageDefaultHandles,
  textMassageTypes
};