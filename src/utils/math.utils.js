function normalize(v) {
  return String(v || "").trim().toLowerCase();
}

function toNumber(val) {
  if (val === null || val === undefined) return 0;
  const n = Number(String(val).replace(/[$, ]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function toName(val) {
  const s = String(val || "").trim();
  return s.length ? s : "Unknown";
}

module.exports = { normalize, toNumber, toName };
