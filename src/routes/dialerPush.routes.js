const router = require("express").Router();

const PUSH_KEY = process.env.DIALER_PUSH_KEY;
const TTL_SECONDS = Number(process.env.DIALER_CACHE_TTL_SECONDS || 10);

// Simple in-memory cache (good enough for live dashboard)
// If you want persistence later, we’ll store in DB.
let cache = {
  ts: 0,
  data: { count: 0, aaData: [] },
};

function requirePushKey(req, res, next) {
  const key = req.headers["x-push-key"];
  if (!PUSH_KEY) return res.status(500).json({ error: "Missing DIALER_PUSH_KEY on server" });
  if (key !== PUSH_KEY) return res.status(401).json({ error: "unauthorized" });
  next();
}

// Office PC pushes here
router.post("/push", requirePushKey, (req, res) => {
  const payload = req.body;

  if (!payload || !Array.isArray(payload.aaData)) {
    return res.status(400).json({ error: "Invalid payload. Expected {count, aaData: []}" });
  }

  cache = {
    ts: Date.now(),
    data: {
      count: payload.count ?? payload.aaData.length,
      aaData: payload.aaData,
    },
  };

  return res.json({ ok: true, received: cache.data.count });
});

// Frontend reads here
router.get("/latest", (req, res) => {
  const ageSec = (Date.now() - cache.ts) / 1000;
  const stale = cache.ts === 0 || ageSec > TTL_SECONDS;

  return res.json({
    ...cache.data,
    meta: {
      updatedAt: cache.ts ? new Date(cache.ts).toISOString() : null,
      ageSeconds: Math.round(ageSec),
      stale,
    },
  });
});

module.exports = router;

