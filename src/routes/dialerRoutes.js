// src/routes/dialerRoutes.js
const router = require("express").Router();
const { getOmniDialerSimple } = require("../controllers/dialerController");

// GET /api/dialer/omni/simple
router.get("/omni/simple", getOmniDialerSimple);

module.exports = router;
