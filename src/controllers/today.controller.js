const { fetchMavericks, filterByFETeam, teamBreakdown } = require("../services/mavericks.service");
const { todayStr } = require("../utils/date.utils");
const { FE_SALES_FIELD } = require("../config/env");
const { ALLOWED_FE_TEAMS } = require("../config/constants");

function pick(obj, keys = []) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d)) return null;
  return d.toISOString().slice(0, 10);
}

function formatTime(value) {
  if (!value) return null;

  const d = new Date(value);
  if (!isNaN(d)) return d.toTimeString().slice(0, 8);

  const str = String(value).trim();
  const match = str.match(/\b\d{1,2}:\d{2}(:\d{2})?\b/);
  return match ? match[0] : null;
}

function shapeRecord(r) {
  const dateSource = pick(r, [
    "Processing Date",
    "processing_date",
    "processingDate",
    "Date",
    "date",
    "Created At",
    "created_at",
    "createdAt",
    "Timestamp",
    "timestamp"
  ]);

  const timeSource =
    pick(r, [
      "Time",
      "time",
      "Processing Time",
      "processing_time"
    ]) || dateSource;

  return {
    processingDate: formatDate(dateSource), // formatted date
    time: formatTime(timeSource), // extracted time fallback
    customerId: pick(r, [
      "Customer ID",
    ]),
    state: pick(r, ["State", "state"]),
    carrier: pick(r, ["Carrier", "carrier", "Sale Carrier", "Sale_Carrier"]),
    product: pick(r, ["Customer Eligibility", "product", "Product"]),
    backupcarrier: pick(r, ["Backup Carrier", "backup_carrier"]),
    qualifierName: pick(r, [
      "Qualifier Name",
      "qualifier_name",
      "Qualifier",
      "qualifier",
    ]),
    team: pick(r, ["Team", "team", "FE Sales Team", "fe_sales_team"]),
    Validator: pick(r, [
      "Validator",
      "validator",
      "Closer Name",
      "closer_name",
      "Closer",
      "closer"
    ]),
    processingStage: pick(r, [
      "Processing Stage",
      "processing_stage",
      "Lead Stage",
      "Stage",
      "stage"
    ]),
    closerStatus: pick(r, [
      "Closer Status",
      "closer_status",
      "Closer_Status",
      "CloserStatus"
    ]),
    Feedback: pick(r, ["Call Feedback"]),
    Notes: pick(r, ["Feedback Detail"]),
    CarrierPitch: pick(r, ["Sale Carrier-P"])
  };
}

exports.todayRaw = async (req, res) => {
  try {
    const start_date = todayStr();
    const records = await fetchMavericks({ start_date });
    const shaped = records.map(shapeRecord);

    res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date },
      totalRecords: shaped.length,
      records: shaped
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message
    });
  }
};

exports.todayFEAgents = async (req, res) => {
  try {
    const start_date = todayStr();
    const team = req.query.team;

    const records = await fetchMavericks({ start_date });
    const filtered = filterByFETeam(records, team);
    const shaped = filtered.map(shapeRecord);

    res.json({
      ok: true,
      source: "mavericks_data",
      range: { start_date },
      filters: {
        field: FE_SALES_FIELD,
        allowedTeams: ALLOWED_FE_TEAMS,
        team: team || "ALL"
      },
      totalRecords: shaped.length,
      teamBreakdown: teamBreakdown(filtered),
      records: shaped
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message
    });
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
      firstRecordSample: records[0] ? shapeRecord(records[0]) : null
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message
    });
  }
};