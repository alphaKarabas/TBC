const Router = require("express");
const router = new Router();
const BotController = require("../controllers/BotController");
const authMiddleware = require("../middleware/auth.middleware");
const ruleMiddleware = require("../middleware/rule.middleware");

router.get("/key", [authMiddleware, ruleMiddleware], BotController.verificationKey);
router.get("", [authMiddleware, ruleMiddleware], BotController.getBots);
router.post("", [authMiddleware, ruleMiddleware], BotController.creataBot);
router.delete("", [authMiddleware, ruleMiddleware], BotController.deleteBot);
router.patch("", [authMiddleware, ruleMiddleware], BotController.patchBot);
router.put("", [authMiddleware, ruleMiddleware], BotController.copyBot);

module.exports = router;
