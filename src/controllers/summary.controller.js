const { fetchMavericks, filterByFETeam } = require("../services/mavericks.service");
const { todayStr, weekStartStr } = require("../utils/date.utils");
const { toNumber, toName } = require("../utils/math.utils");
const { QUALIFIER_FIELD, MP_FIELD } = require("../config/env");

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

exports.todaySummary = async (req, res) => {
  try {
    const start_date = todayStr();
    const records = await fetchMavericks({ start_date });

    res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date },
      groupBy: QUALIFIER_FIELD,
      mpField: MP_FIELD,
      rows: buildQualifierSummary(records),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
};

exports.todayFESummary = async (req, res) => {
  try {
    const start_date = todayStr();
    const team = req.query.team;

    let records = await fetchMavericks({ start_date });
    records = filterByFETeam(records, team);

    res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date },
      team: team || "ALL",
      groupBy: QUALIFIER_FIELD,
      mpField: MP_FIELD,
      rows: buildQualifierSummary(records),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
};

exports.weekSummary = async (req, res) => {
  try {
    const start_date = weekStartStr();
    const end_date = todayStr();

    const records = await fetchMavericks({ start_date, end_date });

    res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date, end_date },
      groupBy: QUALIFIER_FIELD,
      mpField: MP_FIELD,
      rows: buildQualifierSummary(records),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
};

exports.weekFESummary = async (req, res) => {
  try {
    const start_date = weekStartStr();
    const end_date = todayStr();
    const team = req.query.team;

    let records = await fetchMavericks({ start_date, end_date });
    records = filterByFETeam(records, team);

    res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date, end_date },
      team: team || "ALL",
      groupBy: QUALIFIER_FIELD,
      mpField: MP_FIELD,
      rows: buildQualifierSummary(records),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
};
