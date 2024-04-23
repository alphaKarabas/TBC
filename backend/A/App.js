const BotManager = require("./BotManager");
const BotController = require("./BotController");
class App {
  constructor() {
    if (App.exists) {
      return App.instanse;
    }
    App.instanse = this;
    App.exists = true;
  }

  async start() {
    const botManager = new BotManager();
    await botManager.load();
    await botManager.loadBots();
    const controller = new BotController();
    await botManager.startAll(controller);
  }
}

module.exports = App;
