// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const axios = require("axios");
// const { DateTime } = require("luxon");

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // =====================
// // CONFIG
// // =====================
// const PORT = process.env.PORT || 5000;
// const TIMEZONE = process.env.TIMEZONE || "America/New_York";
// const API_URL = process.env.API_URL;
// const X_TEAM_KEY = process.env.X_TEAM_KEY;

// // Field name in each mavericks_data record
// const FE_SALES_FIELD = process.env.FE_SALES_FIELD || "FE Sales Team";

// // Allowed FE teams
// const ALLOWED_FE_TEAMS = ["Legends", "Maserati", "Falcons", "Sharks"];

// if (!API_URL) throw new Error("Missing API_URL in .env");
// if (!X_TEAM_KEY) throw new Error("Missing X_TEAM_KEY in .env");

// // =====================
// // DATE HELPERS
// // =====================
// function todayStr() {
//   return DateTime.now().setZone(TIMEZONE).toFormat("yyyy-MM-dd");
// }

// // Monday -> today
// function weekStartStr() {
//   const now = DateTime.now().setZone(TIMEZONE);
//   const monday = now.startOf("day").minus({ days: now.weekday - 1 }); // 1=Mon
//   return monday.toFormat("yyyy-MM-dd");
// }

// // =====================
// // NORMALIZATION HELPERS
// // =====================
// function norm(v) {
//   return String(v || "").trim().toLowerCase();
// }
// const allowedSet = new Set(ALLOWED_FE_TEAMS.map(norm));

// // =====================
// // API CALL (POST)
// // =====================
// async function fetchWorkLeads({ start_date, end_date }) {
//   const payload = { start_date };
//   if (end_date) payload.end_date = end_date;

//   const res = await axios.post(API_URL, payload, {
//     headers: {
//       "X-Team-Key": X_TEAM_KEY,
//       "Content-Type": "application/json",
//     },
//     timeout: 30000,
//   });

//   return res.data;
// }

// // =====================
// // MAVERICKS ONLY HELPERS
// // =====================
// function getMavericksRecords(apiData) {
//   return Array.isArray(apiData?.mavericks_data) ? apiData.mavericks_data : [];
// }

// function filterByFETeams(records, teamQuery) {
//   const teamQ = teamQuery ? norm(teamQuery) : null;

//   return records.filter((r) => {
//     const teamVal = r?.[FE_SALES_FIELD];
//     const teamN = norm(teamVal);

//     // must match allowed teams
//     if (!allowedSet.has(teamN)) return false;

//     // optional single-team filter
//     if (teamQ && teamN !== teamQ) return false;

//     return true;
//   });
// }

// function teamBreakdown(records) {
//   const counts = {};
//   for (const r of records) {
//     const t = String(r?.[FE_SALES_FIELD] || "Unknown").trim();
//     counts[t] = (counts[t] || 0) + 1;
//   }
//   return counts;
// }

// // =====================
// // ROUTES (ALL MAVERICKS ONLY)
// // =====================
// app.get("/", (req, res) => {
//   res.send(
//     "Goal Tracker backend running (MAVERICKS ONLY). Try /health, /api/today, /api/week, /api/today/fe-agents, /api/week/fe-agents"
//   );
// });

// app.get("/health", (req, res) => {
//   res.json({
//     ok: true,
//     timezone: TIMEZONE,
//     feSalesField: FE_SALES_FIELD,
//     allowedTeams: ALLOWED_FE_TEAMS,
//   });
// });

// /**
//  * TODAY (MAVERICKS ONLY, RAW)
//  * Returns only mavericks_data (not processing_date_data)
//  */
// app.get("/api/today", async (req, res) => {
//   try {
//     const start_date = todayStr();
//     const apiData = await fetchWorkLeads({ start_date });

//     res.json({
//       ok: true,
//       source: "mavericks_data",
//       range: { start_date },
//       fetchedAt: new Date().toISOString(),
//       totalRecords: getMavericksRecords(apiData).length,
//       records: getMavericksRecords(apiData),
//     });
//   } catch (e) {
//     res.status(500).json({ ok: false, error: e?.response?.data || e.message });
//   }
// });

// /**
//  * WEEK (MAVERICKS ONLY, RAW)
//  * Monday -> today
//  */
// app.get("/api/week", async (req, res) => {
//   try {
//     const start_date = weekStartStr();
//     const end_date = todayStr();
//     const apiData = await fetchWorkLeads({ start_date, end_date });

//     res.json({
//       ok: true,
//       source: "mavericks_data",
//       range: { start_date, end_date },
//       fetchedAt: new Date().toISOString(),
//       totalRecords: getMavericksRecords(apiData).length,
//       records: getMavericksRecords(apiData),
//     });
//   } catch (e) {
//     res.status(500).json({ ok: false, error: e?.response?.data || e.message });
//   }
// });

// /**
//  * TODAY FE AGENTS (MAVERICKS ONLY)
//  * Optional filter: ?team=Legends
//  */
// app.get("/api/today/fe-agents", async (req, res) => {
//   try {
//     const start_date = todayStr();
//     const team = req.query.team;

//     const apiData = await fetchWorkLeads({ start_date });
//     const records = getMavericksRecords(apiData);
//     const filtered = filterByFETeams(records, team);

//     res.json({
//       ok: true,
//       source: "mavericks_data",
//       range: { start_date },
//       filters: {
//         field: FE_SALES_FIELD,
//         allowedTeams: ALLOWED_FE_TEAMS,
//         team: team || "ALL",
//       },
//       fetchedAt: new Date().toISOString(),
//       totalRecords: filtered.length,
//       teamBreakdown: teamBreakdown(filtered),
//       records: filtered,
//     });
//   } catch (e) {
//     res.status(500).json({ ok: false, error: e?.response?.data || e.message });
//   }
// });

// /**
//  * WEEK FE AGENTS (MAVERICKS ONLY)
//  * Optional filter: ?team=Sharks
//  */
// app.get("/api/week/fe-agents", async (req, res) => {
//   try {
//     const start_date = weekStartStr();
//     const end_date = todayStr();
//     const team = req.query.team;

//     const apiData = await fetchWorkLeads({ start_date, end_date });
//     const records = getMavericksRecords(apiData);
//     const filtered = filterByFETeams(records, team);

//     res.json({
//       ok: true,
//       source: "mavericks_data",
//       range: { start_date, end_date },
//       filters: {
//         field: FE_SALES_FIELD,
//         allowedTeams: ALLOWED_FE_TEAMS,
//         team: team || "ALL",
//       },
//       fetchedAt: new Date().toISOString(),
//       totalRecords: filtered.length,
//       teamBreakdown: teamBreakdown(filtered),
//       records: filtered,
//     });
//   } catch (e) {
//     res.status(500).json({ ok: false, error: e?.response?.data || e.message });
//   }
// });

// /**
//  * DEBUG: show distinct FE team values coming back TODAY (MAVERICKS ONLY)
//  * Useful if filtering returns 0.
//  */
// app.get("/api/today/fe-debug", async (req, res) => {
//   try {
//     const start_date = todayStr();
//     const apiData = await fetchWorkLeads({ start_date });
//     const records = getMavericksRecords(apiData);

//     const distinct = Array.from(
//       new Set(records.map((r) => String(r?.[FE_SALES_FIELD] ?? "").trim()).filter(Boolean))
//     ).sort();

//     res.json({
//       ok: true,
//       source: "mavericks_data",
//       range: { start_date },
//       feField: FE_SALES_FIELD,
//       totalMavericksRecords: records.length,
//       distinctFESalesTeams: distinct,
//       firstRecordKeys: records[0] ? Object.keys(records[0]) : [],
//       firstRecordSample: records[0] || null,
//     });
//   } catch (e) {
//     res.status(500).json({ ok: false, error: e?.response?.data || e.message });
//   }
// });

// // =====================
// // START
// // =====================
// app.listen(PORT, () => {
//   console.log(`Backend running on http://localhost:${PORT}`);
//   console.log(`Timezone: ${TIMEZONE}`);
//   console.log(`Source: MAVERICKS ONLY`);
//   console.log(`FE field: ${FE_SALES_FIELD}`);
//   console.log(`Allowed FE Teams: ${ALLOWED_FE_TEAMS.join(", ")}`);
// });



const express = require("express");
const cors = require("cors");
const { PORT } = require("./config/env");

const todayRoutes = require("./routes/today.routes");
const weekRoutes = require("./routes/week.routes");
const summaryRoutes = require("./routes/summary.routes");
const refreshRoutes = require("./routes/refresh.routes");
const bonusRoutes = require("./routes/bonus.routes");
const rangeRoutes = require("./routes/range.routes");
const queueRoutes = require("./routes/queue.routes")


const app = express();
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://workbonustracker.onrender.com"
  ],
  allowedHeaders: ["Content-Type", "x-admin-key"],
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Goal Tracker Backend (Mavericks Only) - Try /health, /api/today, /api/week, /api/summary");
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/today", todayRoutes);
app.use("/api/week", weekRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/refresh", refreshRoutes);
app.use("/api/bonus", bonusRoutes);
app.use("/api/range", rangeRoutes);
app.use("/api/queue", queueRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
