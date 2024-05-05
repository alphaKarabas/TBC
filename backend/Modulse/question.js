const listeners = {
  message: async ({ msg, node, data, next, bot }) => {
    console.log(node);
    next("main-source", {
      'answer': msg.text
    });
  },
  activation: async ({ node, data, next, bot }) => {
    await bot.sendMessage(data['chat-id'], node['text']);
  },
};

const textModule = {
  type: 'sessional',
  listeners: listeners,
  targets: [
    {
      key: 'chat-id',
      type: 'chat-id',
      required: true
    },
  ],
  sources: [
    {
      key: 'answer',
      type: 'text',
    }
  ],
}

module.exports = textModule;