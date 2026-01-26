const axios = require("axios");
const { API_URL, X_TEAM_KEY, FE_SALES_FIELD } = require("../config/env");
const { ALLOWED_FE_TEAMS } = require("../config/constants");
const { normalize } = require("../utils/math.utils");

if (!API_URL) throw new Error("Missing WORK_LEADS_API_URL in .env");
if (!X_TEAM_KEY) throw new Error("Missing WORK_LEADS_TEAM_KEY in .env");

/* =========================
   Base fetch
========================= */
async function fetchWorkLeads({ start_date, end_date } = {}) {
  if (!start_date) throw new Error("fetchWorkLeads: start_date is required");

  const payload = { start_date };
  if (end_date) payload.end_date = end_date;

  const res = await axios.post(API_URL, payload, {
    headers: {
      "X-Team-Key": X_TEAM_KEY,
      "Content-Type": "application/json",
    },
    timeout: 60000,
  });

  return res.data || {};
}



/* =========================
   FE-only processing data
========================= */
async function fetchProcessingDateDataFE({ start_date, end_date } = {}) {
  const json = await fetchWorkLeads({ start_date, end_date });

  let rows = json.processing_date_data || [];
  if (!Array.isArray(rows)) rows = [rows];

  const allowed = new Set(ALLOWED_FE_TEAMS.map(normalize));

  function pick(r, keys) {
    for (const k of keys) {
      const v = r?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return "";
  }

function subtract10Hours(dt) {
  if (!dt) return { date: "", time: "" };

  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) {
    return { date: String(dt), time: "" };
  }

  // subtract 10 hours
  d.setHours(d.getHours() );

  const date = d.toISOString().slice(0, 10); // YYYY-MM-DD
  const time = d.toISOString().slice(11, 16); // HH:mm

  return { date, time };
}




  function onlySelectedFields(r) {
    // 1) grab the datetime
    const processingDT = pick(r, [
      "Processing Date",

    ]);

    // 2) split into date+time
    const { date, time } = subtract10Hours(processingDT);

    // 3) if dataset already has a time field, prefer that, else use extracted time
    

    return {
      processingDate: date,                 // ✅ formatted date
      time: time,           // ✅ extracted time fallback
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
      Validator: pick(r, ["Validator", "validator", "Closer Name", "closer_name", "Closer", "closer"]),
      processingStage: pick(r, ["Processing Stage", "processing_stage", "Lead Stage", "Stage", "stage"]),
      closerStatus: pick(r, ["Closer Status", "closer_status", "Closer_Status", "CloserStatus"]),

    };
  }

  return rows
    .filter((r) => {
      const teamVal = pick(r, ["Team", "team", "FE Sales Team", "fe_sales_team"]);
      return teamVal && allowed.has(normalize(teamVal));
    })
    .map(onlySelectedFields);
}


module.exports = {
  fetchProcessingDateDataFE,
};
