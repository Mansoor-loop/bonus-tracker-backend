const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { PORT } = require("./config/env");

const todayRoutes = require("./routes/today.routes");
const weekRoutes = require("./routes/week.routes");
const summaryRoutes = require("./routes/summary.routes");
const refreshRoutes = require("./routes/refresh.routes");
const bonusRoutes = require("./routes/bonus.routes");
const rangeRoutes = require("./routes/range.routes");
const queueRoutes = require("./routes/queue.routes");
const dialerRoutes = require("./routes/dialerRoutes");
const dialerPushRoutes = require("./routes/dialerPush.routes");

const app = express();

/* =========================
   ENV
========================= */
const ADMIN_KEY = process.env.ADMIN_KEY;
const PUSH_KEY = process.env.DIALER_PUSH_KEY;

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://workbonustracker.onrender.com",
];

/* =========================
   BASIC HARDENING
========================= */
app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* =========================
   CORS
   Note:
   CORS is browser protection only, not real auth.
========================= */
app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server tools / curl / postman with no origin
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-key", "x-push-key"],
    credentials: false,
  })
);

/* =========================
   BODY PARSING
========================= */
app.use(express.json({ limit: "200kb" }));

/* =========================
   RATE LIMITING
========================= */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sensitive requests. Please slow down." },
});

app.use(globalLimiter);

/* =========================
   AUTH MIDDLEWARE
========================= */
function requireAdmin(req, res, next) {
  if (!ADMIN_KEY) {
    return res.status(500).json({ error: "Server misconfigured: ADMIN_KEY missing" });
  }

  const key = req.header("x-admin-key");

  if (!key || key !== ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

function requirePushKey(req, res, next) {
  if (!PUSH_KEY) {
    return res.status(500).json({ error: "Server misconfigured: DIALER_PUSH_KEY missing" });
  }

  const key = req.header("x-push-key");

  if (!key || key !== PUSH_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

/* =========================
   HEALTH / ROOT
========================= */
app.get("/", (req, res) => {
  res.send("Goal Tracker Backend is running.");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/* =========================
   PUBLIC / SEMI-PUBLIC ROUTES
   Protect more of these with requireAdmin if data is private.
========================= */
app.use("/api/today", todayRoutes);
app.use("/api/week", weekRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/bonus", bonusRoutes);
app.use("/api/range", rangeRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/dialer", dialerRoutes);

/* =========================
   SENSITIVE ROUTES
========================= */
app.use("/api/refresh", strictLimiter, requireAdmin, refreshRoutes);

/*
  If dialerPush.routes contains a POST /push endpoint,
  mounting here means it becomes /api/dialer/push
*/
app.use("/api/dialer", strictLimiter, requirePushKey, dialerPushRoutes);

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS blocked" });
  }

  res.status(500).json({ error: "Internal server error" });
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});