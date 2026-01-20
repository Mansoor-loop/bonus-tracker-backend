const router = require("express").Router();
const ctrl = require("../controllers/summary.controller");
const { getSummaryRangeFe } = require("../controllers/range.controller");

router.get("/range/fe", getSummaryRangeFe);

router.get("/today", ctrl.todaySummary);
router.get("/today/fe", ctrl.todayFESummary);
router.get("/week", ctrl.weekSummary);
router.get("/week/fe", ctrl.weekFESummary);


module.exports = router;
