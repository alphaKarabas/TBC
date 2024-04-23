const listeners = {
  activation: async ({ node, data, next, bot }) => {
    await bot.sendMessage(data['chat-id'], node['text']);
    next('main-source', {})
  },
};

const textModule = {
  type: 'logical',
  listeners: listeners,
  targets: [
    {
      key: 'chat-id',
      type: 'chat-id',
      required: true
    },
  ],
  sources: [],
}

module.exports = textModule;