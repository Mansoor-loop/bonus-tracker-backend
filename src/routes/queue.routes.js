const router = require("express").Router();
const queue = require("../controllers/queue.controller");

// GET /api/queue/today
router.get("/today", queue.queueToday);

module.exports = router;
