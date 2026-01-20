const router = require("express").Router();
const { todayStr, weekStartStr } = require("../utils/date.utils");
const { fetchMavericks } = require("../services/mavericks.service");

async function refreshToday(req, res) {
  try {
    const start_date = todayStr();
    const records = await fetchMavericks({ start_date });
    res.json({ ok: true, refreshed: true, range: { start_date }, totalRecords: records.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
}

async function refreshWeek(req, res) {
  try {
    const start_date = weekStartStr();
    const end_date = todayStr();
    const records = await fetchMavericks({ start_date, end_date });
    res.json({ ok: true, refreshed: true, range: { start_date, end_date }, totalRecords: records.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
}

// Support BOTH GET (browser) and POST (frontend button)
router.get("/today", refreshToday);
router.post("/today", refreshToday);

router.get("/week", refreshWeek);
router.post("/week", refreshWeek);

module.exports = router;
