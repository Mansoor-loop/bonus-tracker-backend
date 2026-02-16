// src/services/omniService.js
const axios = require("axios").default;
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const cheerio = require("cheerio");

const omniCfg = require("../config/omni");

function supervisedAgentsUrl(base) {
  return (
    `${base}/Manager/Users/SupervisedAgents` +
    `?ServiceId=0&serviceName=&sEcho=11&iColumns=15&sColumns=%2C%2C%2C%2C%2C%2C%2C%2C%2C%2C%2C%2C%2C%2C` +
    `&iDisplayStart=0&iDisplayLength=-1` +
    `&mDP_0=0&sS_0=&bRgx_0=false&bSearch_0=true&bSort_0=false` +
    `&mDP_1=1&sS_1=&bRgx_1=false&bSearch_1=true&bSort_1=true` +
    `&mDP_2=2&sS_2=&bRgx_2=false&bSearch_2=true&bSort_2=true` +
    `&mDP_3=3&sS_3=&bRgx_3=false&bSearch_3=true&bSort_3=true` +
    `&mDP_4=4&sS_4=&bRgx_4=false&bSearch_4=true&bSort_4=true` +
    `&mDP_5=5&sS_5=&bRgx_5=false&bSearch_5=true&bSort_5=true` +
    `&mDP_6=6&sS_6=&bRgx_6=false&bSearch_6=true&bSort_6=true` +
    `&mDP_7=7&sS_7=&bRgx_7=false&bSearch_7=true&bSort_7=true` +
    `&mDP_8=8&sS_8=&bRgx_8=false&bSearch_8=true&bSort_8=true` +
    `&mDP_9=9&sS_9=&bRgx_9=false&bSearch_9=true&bSort_9=true` +
    `&mDP_10=10&sS_10=&bRgx_10=false&bSearch_10=true&bSort_10=true` +
    `&mDP_11=11&sS_11=&bRgx_11=false&bSearch_11=true&bSort_11=true` +
    `&mDP_12=12&sS_12=&bRgx_12=false&bSearch_12=true&bSort_12=true` +
    `&mDP_13=13&sS_13=&bRgx_13=false&bSearch_13=true&bSort_13=true` +
    `&mDP_14=14&sS_14=&bRgx_14=false&bSearch_14=true&bSort_14=true` +
    `&sSearch=&bRegex=false&iSC_0=2&sSD_0=asc&iSortingCols=1&_=${Date.now()}`
  );
}

function makeClient() {
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      timeout: 30000,
      maxRedirects: 10,
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      validateStatus: () => true,
    })
  );
  return { client, jar };
}

function isLoginPage(html) {
  return typeof html === "string" && html.includes('body class="login-page"');
}

function decodeHtmlEntities(str) {
  return String(str)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripParenId(nameWithId) {
  return String(nameWithId).replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function extractTitle(html) {
  const s = decodeHtmlEntities(html);
  const m = s.match(/title\s*=\s*['"]([^'"]+)['"]/i);
  return m ? m[1].trim() : "";
}

function extractDuration(html) {
  const s = decodeHtmlEntities(html);

  let m = s.match(/\((\d+\s*[smhd])\)/i);
  if (m) return m[1].replace(/\s+/g, "").trim();

  m = s.match(/>(\d+\s*[smhd])</i);
  if (m) return m[1].replace(/\s+/g, "").trim();

  m = s.match(/\b(\d+\s*[smhd])\b/i);
  return m ? m[1].replace(/\s+/g, "").trim() : "";
}

async function login(client, base, username, password) {
  const loginUrl = `${base}${omniCfg.LOGIN_PATH}`;
  const supervisionListUrl = `${base}${omniCfg.SUPERVISION_LIST_PATH}`;

  const page = await client.get(loginUrl);
  if (page.status !== 200) throw new Error(`GET Login failed: ${page.status}`);

  const $ = cheerio.load(page.data);
  const returnUrl = $('input[name="ReturnUrl"]').attr("value") || "";

  const form = new URLSearchParams();
  form.set("Usuario", username);
  form.set("Contrasenya", password);
  if (returnUrl) form.set("ReturnUrl", returnUrl);

  const resp = await client.post(loginUrl, form.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: base,
      Referer: loginUrl,
    },
  });

  if (isLoginPage(resp.data)) {
    throw new Error("Login failed: server returned login page again.");
  }

  const probe = await client.get(supervisionListUrl, {
    headers: { Referer: loginUrl },
  });

  if (probe.status !== 200 || isLoginPage(probe.data)) {
    throw new Error(`Login did not persist. Probe status=${probe.status}`);
  }

  return true;
}

async function fetchSupervisedAgentsSimple() {
  const { OMNI_BASE, OMNI_USER, OMNI_PASS } = omniCfg;
  if (!OMNI_USER || !OMNI_PASS) {
    throw new Error("Missing OMNI_USER / OMNI_PASS env vars");
  }

  const { client } = makeClient();
  await login(client, OMNI_BASE, OMNI_USER, OMNI_PASS);

  const r = await client.get(supervisedAgentsUrl(OMNI_BASE), {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${OMNI_BASE}${omniCfg.SUPERVISION_LIST_PATH}`,
    },
  });

  if (typeof r.data === "string" && isLoginPage(r.data)) {
    throw new Error("Not authenticated: API response is login page HTML.");
  }
  if (r.status !== 200) throw new Error(`SupervisedAgents non-200: ${r.status}`);

  const raw = r.data || {};
const simplified = (raw.aaData || [])
  .map((row) => {
    const qualifierName = stripParenId(row[1] || "");
    const campaign = String(row[2] || "").trim();
    const status = extractTitle(row[3] || "");
    const duration = extractDuration(row[3] || "");

    return { qualifierName, campaign, status, duration };
  })
  // 🚫 remove Validators_Service
  .filter(r => r.campaign !== "Validators_Service");


  return { count: simplified.length, aaData: simplified };
}

module.exports = {
  fetchSupervisedAgentsSimple,
};
