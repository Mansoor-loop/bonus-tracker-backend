const { fetchMavericks, filterByFETeam, teamBreakdown } = require("../services/mavericks.service");
const { todayStr, weekStartStr } = require("../utils/date.utils");
const { FE_SALES_FIELD } = require("../config/env");
const { ALLOWED_FE_TEAMS } = require("../config/constants");

exports.weekRaw = async (req, res) => {
  try {
    const start_date = weekStartStr();
    const end_date = todayStr();

    const records = await fetchMavericks({ start_date, end_date });

    res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date, end_date },
      totalRecords: records.length,
      records
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
};

exports.weekFEAgents = async (req, res) => {
  try {
    const start_date = weekStartStr();
    const end_date = todayStr();
    const team = req.query.team;

    const records = await fetchMavericks({ start_date, end_date });
    const filtered = filterByFETeam(records, team);

    res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date, end_date },
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
