const router = require("express").Router();
const ctrl = require("../controllers/today.controller");


router.get("/", ctrl.todayRaw);
router.get("/fe-agents", ctrl.todayFEAgents);
router.get("/fe-debug", ctrl.todayFEDebug);

module.exports = router;
