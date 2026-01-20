const { DateTime } = require("luxon");
const { TIMEZONE } = require("../config/env");

function todayStr() {
  return DateTime.now().setZone(TIMEZONE).toFormat("yyyy-MM-dd");
}

function weekStartStr() {
  const now = DateTime.now().setZone(TIMEZONE);
  const monday = now.startOf("day").minus({ days: now.weekday - 1 }); // Monday
  return monday.toFormat("yyyy-MM-dd");
}
function parseISODate(s) {
  if (!s || typeof s !== "string") return null;

  // Accept only YYYY-MM-DD at the start
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!m) return null;

  const d = new Date(m[1] + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  return d;
}


function inDateRange(dateStr, start, end) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d >= start && d <= end;
}


module.exports = { todayStr, weekStartStr ,parseISODate,
  inDateRange };
