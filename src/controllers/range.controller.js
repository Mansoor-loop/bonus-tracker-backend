// backend/src/controllers/range.controller.js
const {
  fetchMavericksRangeStream,
  filterByFETeam,
  teamBreakdownFromCounts,
} = require("../services/mavericks.service");

const { FE_SALES_FIELD, QUALIFIER_FIELD, MP_FIELD } = require("../config/env");
const { ALLOWED_FE_TEAMS } = require("../config/constants");
const { toNumber, toName } = require("../utils/math.utils");

function finalizeSummary(map) {
  const out = Array.from(map.values()).sort((a, b) => b.apSum - a.apSum);
  for (const r of out) {
    r.mpSum = Math.round(r.mpSum * 100) / 100;
    r.apSum = Math.round(r.apSum * 100) / 100;
  }
  return out;
}

// GET /api/range/fe-agents?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&team=Legends
exports.getFeAgentsRange = async (req, res) => {
  try {
    const { start_date, end_date, team } = req.query;
    if (!start_date) return res.status(400).json({ ok: false, error: "start_date required" });

    // counts only (no records)
    const counts = {};
    for (const t of ALLOWED_FE_TEAMS) counts[t] = 0;

    let total = 0;

    await fetchMavericksRangeStream(
      { start_date, end_date: end_date || start_date, chunkDays: 1, maxDays: 90 },
      async (rows) => {
        const filtered = filterByFETeam(rows, team);

        total += filtered.length;

        for (const r of filtered) {
          const t = String(r?.[FE_SALES_FIELD] || "Unknown").trim();
          counts[t] = (counts[t] || 0) + 1;
        }
      }
    );

    return res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date, end_date: end_date || start_date },
      filters: {
        field: FE_SALES_FIELD,
        allowedTeams: ALLOWED_FE_TEAMS,
        team: team || "ALL",
      },
      totalRecords: total,
      teamBreakdown: teamBreakdownFromCounts(counts),
      // ✅ DO NOT return records for custom ranges (this is what prevents crashes)
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message || String(e),
    });
  }
};

// GET /api/range/summary/fe?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&team=Legends
exports.getSummaryRangeFe = async (req, res) => {
  try {
    const { start_date, end_date, team } = req.query;
    if (!start_date) return res.status(400).json({ ok: false, error: "start_date required" });

    const map = new Map();

    await fetchMavericksRangeStream(
      { start_date, end_date: end_date || start_date, chunkDays: 1, maxDays: 90 },
      async (rows) => {
        const filtered = filterByFETeam(rows, team);

        for (const r of filtered) {
          const qualifier = toName(r?.[QUALIFIER_FIELD]) || "Unknown";
          const mp = toNumber(r?.[MP_FIELD]);
          const ap = mp * 12;

          if (!map.has(qualifier)) {
            map.set(qualifier, { qualifier, salesCount: 0, mpSum: 0, apSum: 0 });
          }

          const row = map.get(qualifier);
          row.salesCount += 1;
          row.mpSum += mp;
          row.apSum += ap;
        }
      }
    );

    return res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date, end_date: end_date || start_date },
      team: team || "ALL",
      groupBy: QUALIFIER_FIELD,
      mpField: MP_FIELD,
      rows: finalizeSummary(map),
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message || String(e),
    });
  }
};
