const router = require("express").Router();
const range = require("../controllers/range.controller");

router.get("/fe-agents", range.getFeAgentsRange);
router.get("/summary/fe", range.getSummaryRangeFe);

module.exports = router;
