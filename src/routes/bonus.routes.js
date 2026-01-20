const router = require("express").Router();
const { supabase } = require("../config/supabase");
const { todayStr, weekStartStr } = require("../utils/date.utils");

/* ================================
   Simple Admin Protection
================================ */
function requireAdmin(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  next();
}

/* ================================
   Helpers
================================ */
function buildTotals(data) {
  const totals = {};
  for (const r of data || []) {
    const name = String(r.qualifier || "").trim();
    totals[name] = (totals[name] || 0) + Number(r.amount || 0);
  }
  return totals;
}

/* ================================
   ADD / UPDATE BONUS (ADMIN ONLY)
   POST /api/bonus
================================ */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { bonus_date, qualifier, team, amount, note } = req.body;

    if (!bonus_date || !qualifier || amount === undefined || amount === null) {
      return res.status(400).json({
        ok: false,
        error: "bonus_date, qualifier, and amount are required",
      });
    }

    const payload = {
      bonus_date,
      qualifier: String(qualifier).trim(),
      team: team ? String(team).trim() : null,
      amount: Number(amount),
      note: note ? String(note) : null,
    };

    if (!Number.isFinite(payload.amount)) {
      return res.status(400).json({ ok: false, error: "amount must be a number" });
    }

    // upsert based on (bonus_date, qualifier) unique index
    const { data, error } = await supabase
      .from("bonus_entries")
      .upsert(payload, { onConflict: "bonus_date,qualifier" })
      .select("id, bonus_date, qualifier, team, amount, note, created_at")
      .single();

    if (error) throw error;

    res.json({ ok: true, row: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

/* ================================
   GET BONUS TOTALS BY RANGE
   GET /api/bonus/range
   ?start_date=YYYY-MM-DD
   &end_date=YYYY-MM-DD (optional)
   &team=Legends (optional)
================================ */
router.get("/range", async (req, res) => {
  try {
    const { start_date, end_date, team } = req.query;

    if (!start_date) {
      return res.status(400).json({
        ok: false,
        error: "start_date is required (YYYY-MM-DD)",
      });
    }

    let q = supabase
      .from("bonus_entries")
      .select("id, bonus_date, qualifier, team, amount, note, created_at")
      .gte("bonus_date", start_date);

    if (end_date) q = q.lte("bonus_date", end_date);
    if (team && team !== "ALL") q = q.eq("team", team);

    // latest first
    q = q.order("bonus_date", { ascending: false }).order("created_at", { ascending: false });

    const { data, error } = await q;
    if (error) throw error;

    const totals = buildTotals(data);

    res.json({
      ok: true,
      range: { start_date, end_date: end_date || null },
      team: team || "ALL",
      totalRecords: data?.length || 0,
      bonusByQualifier: totals,
      rows: data || [],
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

/* ================================
   CONVENIENCE ENDPOINTS
================================ */

// GET /api/bonus/today?team=Legends
router.get("/today", async (req, res) => {
  try {
    const { team } = req.query;
    const start_date = todayStr();
    const end_date = todayStr();

    let q = supabase
      .from("bonus_entries")
      .select("id, bonus_date, qualifier, team, amount, note, created_at")
      .gte("bonus_date", start_date)
      .lte("bonus_date", end_date)
      .order("created_at", { ascending: false });

    if (team && team !== "ALL") q = q.eq("team", team);

    const { data, error } = await q;
    if (error) throw error;

    res.json({
      ok: true,
      range: { start_date, end_date },
      team: team || "ALL",
      totalRecords: data?.length || 0,
      bonusByQualifier: buildTotals(data),
      rows: data || [],
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

// GET /api/bonus/week?team=Legends
router.get("/week", async (req, res) => {
  try {
    const { team } = req.query;
    const start_date = weekStartStr();
    const end_date = todayStr();

    let q = supabase
      .from("bonus_entries")
      .select("id, bonus_date, qualifier, team, amount, note, created_at")
      .gte("bonus_date", start_date)
      .lte("bonus_date", end_date)
      .order("bonus_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (team && team !== "ALL") q = q.eq("team", team);

    const { data, error } = await q;
    if (error) throw error;

    res.json({
      ok: true,
      range: { start_date, end_date },
      team: team || "ALL",
      totalRecords: data?.length || 0,
      bonusByQualifier: buildTotals(data),
      rows: data || [],
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

/* ================================
   DELETE (ADMIN ONLY)
   DELETE /api/bonus/:id
================================ */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({ ok: false, error: "Missing id" });
    }

    const { data, error } = await supabase
      .from("bonus_entries")
      .delete()
      .eq("id", id)
      .select("id, bonus_date, qualifier, team, amount, note, created_at")
      .single();

    if (error) throw error;

    res.json({ ok: true, deleted: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

module.exports = router;
