const axios = require("axios");
const { API_URL, X_TEAM_KEY, FE_SALES_FIELD } = require("../config/env");
const { ALLOWED_FE_TEAMS } = require("../config/constants");
const { normalize } = require("../utils/math.utils");

if (!API_URL) throw new Error("Missing API_URL in .env");
if (!X_TEAM_KEY) throw new Error("Missing X_TEAM_KEY in .env");

async function fetchMavericks({ start_date, end_date } = {}) {
  if (!start_date) {
    // if you want, return cached/all, but safest is to throw clear error
    throw new Error("fetchMavericks: start_date is required");
  }

  const payload = { start_date };
  if (end_date) payload.end_date = end_date;

  const res = await axios.post(API_URL, payload, {
    headers: {
      "X-Team-Key": X_TEAM_KEY,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
    timeout: 30000,
  });

  // ✅ support multiple possible response shapes
  const data = res.data;
  if (Array.isArray(data?.mavericks_data)) return data.mavericks_data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
}


function filterByFETeam(records, teamQuery) {
  const allowed = new Set(ALLOWED_FE_TEAMS.map(normalize));
  const q = teamQuery ? normalize(teamQuery) : null;

  return records.filter((r) => {
    const teamVal = r?.[FE_SALES_FIELD];
    const teamN = normalize(teamVal);

    if (!allowed.has(teamN)) return false;
    if (q && teamN !== q) return false;

    return true;
  });
}

function teamBreakdown(records) {
  const counts = {};
  for (const r of records) {
    const t = String(r?.[FE_SALES_FIELD] || "Unknown").trim();
    counts[t] = (counts[t] || 0) + 1;
  }
  return counts;
}

module.exports = { fetchMavericks, filterByFETeam, teamBreakdown };
