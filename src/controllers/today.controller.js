const { fetchMavericks, filterByFETeam, teamBreakdown } = require("../services/mavericks.service");
const { todayStr } = require("../utils/date.utils");
const { FE_SALES_FIELD } = require("../config/env");
const { ALLOWED_FE_TEAMS } = require("../config/constants");

exports.todayRaw = async (req, res) => {
  try {
    const start_date = todayStr();
    const records = await fetchMavericks({ start_date });

    res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date },
      totalRecords: records.length,
      records
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
};

exports.todayFEAgents = async (req, res) => {
  try {
    const start_date = todayStr();
    const team = req.query.team;

    const records = await fetchMavericks({ start_date });
    const filtered = filterByFETeam(records, team);

    res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date },
      filters: {
        field: FE_SALES_FIELD,
        allowedTeams: ALLOWED_FE_TEAMS,
        team: team || "ALL"
      },
      totalRecords: filtered.length,
      teamBreakdown: teamBreakdown(filtered),
      records: filtered
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
};

exports.todayFEDebug = async (req, res) => {
  try {
    const start_date = todayStr();
    const records = await fetchMavericks({ start_date });

    const distinct = Array.from(
      new Set(records.map(r => String(r?.[FE_SALES_FIELD] ?? "").trim()).filter(Boolean))
    ).sort();

    res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date },
      feField: FE_SALES_FIELD,
      totalRecords: records.length,
      distinctFESalesTeams: distinct,
      firstRecordKeys: records[0] ? Object.keys(records[0]) : [],
      firstRecordSample: records[0] || null
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
};
