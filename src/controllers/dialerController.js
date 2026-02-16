// src/controllers/dialerController.js
const { fetchSupervisedAgentsSimple } = require("../services/omniService");

async function getOmniDialerSimple(req, res) {
  try {
    const data = await fetchSupervisedAgentsSimple();
    return res.json(data);
  } catch (e) {
    return res.status(500).json({
      error: "Failed to fetch Omni dialer details",
      details: String(e?.message || e),
    });
  }
}

module.exports = {
  getOmniDialerSimple,
};
