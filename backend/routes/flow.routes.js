const Router = require("express");
const router = new Router();
const FlowController = require("../controllers/FlowController");
const authMiddleware = require("../middleware/auth.middleware");
const ruleMiddleware = require("../middleware/rule.middleware");

router.get("", [authMiddleware, ruleMiddleware], FlowController.getFlow);
router.patch("", [authMiddleware, ruleMiddleware], FlowController.changeViewportPosition);

router.post("/node", [authMiddleware, ruleMiddleware], FlowController.addNode);
router.patch("/node/:id/position", [authMiddleware, ruleMiddleware], FlowController.updateNodePosition);
router.patch("/node/:id/data", [authMiddleware, ruleMiddleware], FlowController.updateNodeData);
router.patch("/node/:id/output-key-names", [authMiddleware, ruleMiddleware], FlowController.updateOutputKeys);
router.patch("/node/:id/used-keys", [authMiddleware, ruleMiddleware], FlowController.updateUsedKeys);
router.patch("/node/:id/handles", [authMiddleware, ruleMiddleware], FlowController.updateHandles);
router.patch("/node/used-keys/change-state", [authMiddleware, ruleMiddleware], FlowController.changeUsedKeysState);
router.patch("/node/used-keys/set", [authMiddleware, ruleMiddleware], FlowController.setUsedKeys);
router.patch("/node/used-keys/rename", [authMiddleware, ruleMiddleware], FlowController.renameUsedKeys);
router.delete("/node/:id", [authMiddleware, ruleMiddleware], FlowController.deleteNode);

router.post("/edge", [authMiddleware, ruleMiddleware], FlowController.addEdge);
router.delete("/edge", [authMiddleware, ruleMiddleware], FlowController.deleteEdge);

module.exports = router;
