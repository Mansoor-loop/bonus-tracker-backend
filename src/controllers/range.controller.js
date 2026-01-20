const { fetchMavericks, filterByFETeam, teamBreakdown } = require("../services/mavericks.service");
const { FE_SALES_FIELD, QUALIFIER_FIELD, MP_FIELD } = require("../config/env");
const { ALLOWED_FE_TEAMS } = require("../config/constants");
const { toNumber, toName } = require("../utils/math.utils");

function buildQualifierSummary(records) {
  const map = new Map();

  for (const r of records) {
    const qualifier = toName(r?.[QUALIFIER_FIELD]);
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

  const out = Array.from(map.values()).sort((a, b) => b.apSum - a.apSum);

  for (const row of out) {
    row.mpSum = Math.round(row.mpSum * 100) / 100;
    row.apSum = Math.round(row.apSum * 100) / 100;
  }

  return out;
}

// GET /api/range/fe-agents?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&team=Legends
exports.getFeAgentsRange = async (req, res) => {
  try {
    const { start_date, end_date, team } = req.query;

    if (!start_date) {
      return res.status(400).json({ ok: false, error: "start_date required" });
    }

    const records = await fetchMavericks({
      start_date,
      end_date: end_date || start_date,
    });

    const filtered = filterByFETeam(records, team);

    return res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date, end_date: end_date || start_date },
      filters: {
        field: FE_SALES_FIELD,
        allowedTeams: ALLOWED_FE_TEAMS,
        team: team || "ALL",
      },
      totalRecords: filtered.length,
      teamBreakdown: teamBreakdown(filtered),
      records: filtered,
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

    if (!start_date) {
      return res.status(400).json({ ok: false, error: "start_date required" });
    }

    const records = await fetchMavericks({
      start_date,
      end_date: end_date || start_date,
    });

    const filtered = filterByFETeam(records, team);

    return res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date, end_date: end_date || start_date },
      team: team || "ALL",
      groupBy: QUALIFIER_FIELD,
      mpField: MP_FIELD,
      rows: buildQualifierSummary(filtered),
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message || String(e),
    });
  }
};
