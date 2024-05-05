const express = require("express");
const authRouter = require("./routes/auth.routes");
const botRouter = require("./routes/bot.routes");
const flowRouter = require("./routes/flow.routes");
const telegramBotRouter = require("./routes/telegramBot.routes");
const app = express();
const corsMiddleware = require("./middleware/cors.middleware");
const App = require("./A/App");
const config = require("config");
require("./databaseInitializer");
const PORT = config.get("serverPort");
require("./collectAvailableDataLinks");

app.use(corsMiddleware);
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/bot", botRouter);
app.use("/api/flow", flowRouter);
app.use("/api/telegramBot", telegramBotRouter);

const start = async () => {
  try {
    await new App().start();
    app.listen(PORT, () => console.log("Start " + PORT));
  } catch (e) { }
};

start();
