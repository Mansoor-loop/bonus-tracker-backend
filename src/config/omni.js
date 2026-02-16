// src/config/omni.js
module.exports = {
  OMNI_BASE: process.env.OMNI_BASE || "https://omni-evo128.nobelbiz.com",
  OMNI_USER: process.env.OMNI_USER,
  OMNI_PASS: process.env.OMNI_PASS,

  LOGIN_PATH: "/Manager/Home/Login",
  SUPERVISION_LIST_PATH: "/Manager/Users/SupervisionList",
};
