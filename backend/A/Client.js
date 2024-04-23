const DbClient = require("../models/Client");
const DbBlock = require("../models/Block");

class Client {
  static async create(telegramId, clientData) {
    const client = await DbClient.findOne({ telegramId });
    if (client) return client;
    const newClient = new DbClient({
      telegramId: telegramId,
      language_code: clientData?.language_code,
      first_name: clientData?.first_name,
      username: clientData?.username,
    });
    try {
      await newClient.save();
    } catch (error) {
      console.log(`ERROR: Error when trying to create Client with args:`);
      console.log("DbClient: ", client);
      console.log("telegramId: ", telegramId);
      console.log("clientData: ", clientData);
    }

    return newClient;
  }

  static async update(telegramId, clientData) {
    if (!telegramId || !clientData) return;
    const client = await DbClient.findOne({ telegramId });
    if (!client) return await this.create(telegramId, clientData);
    if (
      client.username != clientData.username ||
      client.first_name != clientData.first_name ||
      client.last_name != clientData.last_name ||
      client.language_code != clientData.language_code
    ) {
      DbClient.updateOne(
        { telegramId },
        {
          username: clientData.username,
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          language_code: clientData.language_code,
        }
      );
    }
    return await DbClient.findOne({ telegramId });
  }
  static async get(telegramId) {
    const client = await DbClient.findOne({ telegramId });
    return client;
  }

  static async find(filter) {
    const client = await DbClient.find(filter);
    return client;
  }

  static async isBlocked(telegramId, botId) {
    const block = await DbBlock.findOne({ telegramId, botId });
    return block ? true : false;
  }

  static async block(telegramId, botId) {
    let block = await DbBlock.findOne({ telegramId, botId });
    if (!block) block = new DbBlock({ telegramId, botId, date: new Date() });
    return await block.save();
  }

  static async unblock(telegramId, botId) {
    return await DbBlock.deleteOne({ telegramId, botId });
  }
}

module.exports = Client;

const keys = {
  "שם (לא כינוי)": "name",
  "מתי משתחרר?": "endServeDate",
  "מתי השתחררתה?": "demobilizationDate",
  "מתי מתגייס?": "startServeDate",
  "מהיכן אתה בארץ?\nיש לגלגל עד האופציה המתאימה!": "location",
  "(לא חובה)  Instagram": "instagram",
  "שם/כינוי Discord (לא חובה)": "discord",
  "תאריך לידה?": "birthDate",
  "איפה משרת?": "serves",
  "מאיפה שמעת עלינו?": "whence",
  "מה אתה?": "whatYou",
  'להט"ב?': "rainbow",
  "בארון?": "closet",
  "נמשך יותר ל...": "lasting",
};
