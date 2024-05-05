const listeners = {
  command: async ({ msg, next }) => {
    console.log('command');
    next("main-source", {
      'message-id': msg.message_id,
      'chat-id': msg.chat.id,
      'telegram-id': msg.from.id
    });
  },
};

const commandModule = {
  type: 'logical',
  listeners: listeners,
  targets: [],
  sources: [
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
    }
  ],
}

module.exports = commandModule;
