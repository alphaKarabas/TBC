const Router = require("express");
const router = new Router();
const BotManager = require("../A/BotManager");
const jwt = require("jsonwebtoken");
const config = require("config");
const botManager = new BotManager();

router.post("", async (req, res) => {
  const token = req.query?.token;
  if (!token) {
    return res.status(401).json({ message: "Bot not find" });
  }
  const decoded = jwt.verify(token, config.get("secretJWTKey"));
  const id = decoded.id;
  const botToken = decoded.token;
  const bot = await botManager.getBot(id);
  if (bot?.token != botToken) return;
  const telegramBot = await bot?.getTelegramBot();
  return res.status(200).json(telegramBot?.processUpdate(req.body));
});

module.exports = router;
