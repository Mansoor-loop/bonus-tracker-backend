require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  TIMEZONE: process.env.TIMEZONE || "America/New_York",
  API_URL: process.env.API_URL,
  X_TEAM_KEY: process.env.X_TEAM_KEY,

  FE_SALES_FIELD: process.env.FE_SALES_FIELD || "FE Sales Team",
  QUALIFIER_FIELD: process.env.QUALIFIER_FIELD || "Qualifier Name",
  MP_FIELD: process.env.MP_FIELD || "MP"
};

