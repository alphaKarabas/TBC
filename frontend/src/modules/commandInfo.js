const commandDefaultData = {
  telegramCommand: '/'
}

const commandTypes = {
  inputs: [],
  outputs: [
    {
      key: 'message-id',
      type: 'message-id',
    },
    {
      key: 'chat-id',
      type: 'chat-id',
    },
    {
      key: 'telegram-id',
      type: 'telegram-id',
    },
    {
      key: 'date',
      type: 'date',
    }
  ],
}

const commandDefaultHandles = {
  targets: [],
  sources: [
    'main-source'
  ],
}

const commandDefaultOutputKeys = {
  'chat-id': { 'name': 'Chat', 'inUse': true },
  'telegram-id': { 'name': 'User', 'inUse': true },
  'message-id': { 'name': 'Command message', 'inUse': false },
  'date': { 'name': 'Date', 'inUse': false }
}


export {
  commandDefaultOutputKeys,
  commandDefaultData,
  commandDefaultHandles,
  commandTypes
};
