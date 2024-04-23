const Session = require("./Session");

class SessionManager {
  constructor() {
    if (SessionManager.exists) {
      return SessionManager.instanse;
    }
    SessionManager.instanse = this;
    SessionManager.exists = true;
    this.sessions = {};
  }

  getSession = (chatId, telegramId, bot) => {
    let session = this.sessions[`${chatId}${telegramId}${bot.id}`];
    if (!session) {
      session = new Session(chatId, telegramId, bot);
      this.sessions[`${chatId}${telegramId}${bot.id}`] = session;
    }
    return session;
  };
}

module.exports = SessionManager;
