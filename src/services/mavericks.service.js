// backend/src/services/mavericks.service.js
const axios = require("axios");
const { API_URL, X_TEAM_KEY, FE_SALES_FIELD } = require("../config/env");
const { ALLOWED_FE_TEAMS } = require("../config/constants");
const { normalize } = require("../utils/math.utils");

if (!API_URL) throw new Error("Missing API_URL in .env");
if (!X_TEAM_KEY) throw new Error("Missing X_TEAM_KEY in .env");

/* =========================
   Date helpers
========================= */
function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function parseISODate(s) {
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${s}`);
  return d;
}

function addDays(dateObj, n) {
  const d = new Date(dateObj);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function clampEnd(chunkEnd, end) {
  return chunkEnd.getTime() > end.getTime() ? end : chunkEnd;
}

/* =========================
   Single call to upstream
========================= */
async function fetchMavericks({ start_date, end_date } = {}) {
  if (!start_date) throw new Error("fetchMavericks: start_date is required");

  const payload = { start_date };
  if (end_date) payload.end_date = end_date;

  const res = await axios.post(API_URL, payload, {
    headers: {
      "X-Team-Key": X_TEAM_KEY,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
    timeout: 120000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const data = res.data;
  if (Array.isArray(data?.mavericks_data)) return data.mavericks_data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

/* =========================
   STREAMING range fetch
   - does NOT accumulate rows in memory
   - calls onChunk(rows, meta) for each chunk
========================= */
async function fetchMavericksRangeStream(
  { start_date, end_date, chunkDays = 1, maxDays = 90 } = {},
  onChunk
) {
  if (!start_date) throw new Error("fetchMavericksRangeStream: start_date is required");
  if (typeof onChunk !== "function") throw new Error("fetchMavericksRangeStream: onChunk must be a function");

  const start = parseISODate(start_date);
  const end = parseISODate(end_date || start_date);

  if (end.getTime() < start.getTime()) {
    throw new Error("fetchMavericksRangeStream: end_date cannot be before start_date");
  }

  const diffDays =
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays > maxDays) {
    throw new Error(`Range too large (${diffDays} days). Max is ${maxDays} days.`);
  }

  for (let d = new Date(start); d.getTime() <= end.getTime(); d = addDays(d, chunkDays)) {
    const chunkStart = new Date(d);
    const chunkEnd = clampEnd(addDays(chunkStart, chunkDays - 1), end);

    const rows = await fetchMavericks({
      start_date: toISODate(chunkStart),
      end_date: toISODate(chunkEnd),
    });

    await onChunk(rows, {
      chunkStart: toISODate(chunkStart),
      chunkEnd: toISODate(chunkEnd),
    });
  }

  return { start_date, end_date: end_date || start_date };
}

/* =========================
   FE helpers
========================= */
function filterByFETeam(records, teamQuery) {
  const allowed = new Set(ALLOWED_FE_TEAMS.map(normalize));
  const q = teamQuery ? normalize(teamQuery) : null;

  return (records || []).filter((r) => {
    const teamVal = r?.[FE_SALES_FIELD];
    const teamN = normalize(teamVal);

    if (!allowed.has(teamN)) return false;
    if (q && teamN !== q) return false;

    return true;
  });
}

function teamBreakdownFromCounts(counts) {
  // ensure all FE teams exist
  const out = {};
  for (const t of ALLOWED_FE_TEAMS) out[t] = counts[t] || 0;
  return out;
}
function teamBreakdown(records) {
  const counts = {};
  for (const r of records || []) {
    const t = String(r?.[FE_SALES_FIELD] || "Unknown").trim();
    counts[t] = (counts[t] || 0) + 1;
  }
  return counts;
}

module.exports = {
  fetchMavericks,
  fetchMavericksRangeStream, // ✅ streaming
  filterByFETeam,
  teamBreakdownFromCounts,
  teamBreakdown
};
