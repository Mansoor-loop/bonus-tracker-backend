const { fetchProcessingDateDataFE } = require("../services/workleads.service");
const { todayStr } = require("../utils/date.utils");

exports.queueToday = async (req, res) => {
  try {
    const start_date = todayStr();
    const end_date = todayStr();

    const rows = await fetchProcessingDateDataFE({ start_date, end_date });

    res.json({
      ok: true,
      source: "processing_date_data",
      feOnly: true,
      teams: ["Legends", "Maserati", "Falcons", "Sharks"],
      range: { start_date, end_date },
      totalRecords: rows.length,
      rows,
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message || String(e),
    });
  }
};
