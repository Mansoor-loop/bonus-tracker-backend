const router = require("express").Router();
const ctrl = require("../controllers/week.controller");

router.get("/", ctrl.weekRaw);
router.get("/fe-agents", ctrl.weekFEAgents);

module.exports = router;
