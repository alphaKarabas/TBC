const questionDefaultData = { 'text': '' }

const questionTypes = {
  inputs: [
    {
      key: 'chat-id',
      type: 'chat-id',
    }
  ],
  outputs: [
    {
      key: 'answer',
      type: 'text',
    }
  ],
}

const questionDefaultHandles = {
  targets: [
    'target'
  ],
  sources: [
    'main-source',
  ],
}

const questionDefaultOutputKeys = {
  'answer': { 'name': 'Answer', 'inUse': true }
}

export {
  questionDefaultOutputKeys,
  questionDefaultData,
  questionDefaultHandles,
  questionTypes
};