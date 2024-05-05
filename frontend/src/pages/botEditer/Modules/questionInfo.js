const questionDefaultData = {
  text: '',
  keyboard: [[{ text: 'Text', key: 'keyboard_0000' }]]
}

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
    'keyboard_0000'
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