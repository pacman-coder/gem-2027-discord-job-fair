// ─────────────────────────────────────────────────────────────────────────────
//  GEM Job Fair 2026 — server
//
//  • Sign in with Discord (OAuth2, "identify" scope only)
//  • Job holders are read live from Discord: whoever has a job's Discord role
//    holds the job. No database, so nothing is lost when the host restarts.
//  • Interviews are graded here; answers never reach the browser.
//  • Accepting an offer adds the Discord role and posts a shout-out.
//
//  Run locally without Discord:  npm run demo
// ─────────────────────────────────────────────────────────────────────────────
import "dotenv/config";
import express from "express";
import cookieSession from "cookie-session";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JOBS, roleEnvName } from "./jobs.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// ─── Config ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === "production";
const DEMO = /^(1|true|yes)$/i.test(process.env.DEMO_MODE || "") || process.argv.includes("--demo");

// DISCORD_API_BASE exists only so the live-update logic can be tested against a stand-in Discord.
const API = process.env.DISCORD_API_BASE || "https://discord.com/api/v10";
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const ANNOUNCE_CHANNEL_ID = process.env.ANNOUNCE_CHANNEL_ID;
// Render sets RENDER_EXTERNAL_URL automatically, so BASE_URL is only needed for a custom domain.
const BASE_URL = (process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`).replace(/\/+$/, "");
const REDIRECT_URI = process.env.REDIRECT_URI || `${BASE_URL}/auth/callback`;
const GROUP_NAME = process.env.GROUP_NAME || "GEM";
const MAX_JOBS = Number.parseInt(process.env.MAX_JOBS_PER_PERSON || "0", 10) || 0; // 0 = no limit
const OFFER_TTL_MS = 15 * 60 * 1000;
const LIVE_CHECK_MS = (Number(process.env.LIVE_CHECK_SECONDS) || 45) * 1000; // how often to look for role changes made in Discord
const NEW_WITHIN_DAYS = 14;

const discordReady = Boolean(BOT_TOKEN && GUILD_ID);
// Looks for ROLE_<JOB_ID>, then any older names listed in the job's envAliases (e.g. last year's ROLE_PRAYER_KEEPER).
const roleIdFor = (job) =>
  process.env[roleEnvName(job.id)] || (job.envAliases || []).map((k) => process.env[k]).find(Boolean) || null;

let SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  SESSION_SECRET = crypto.randomBytes(32).toString("hex");
  if (!DEMO) console.warn("⚠️  SESSION_SECRET is not set. Using a temporary one; everyone gets signed out when the server restarts.");
}

if (!DEMO) {
  const missing = ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET", "DISCORD_BOT_TOKEN", "DISCORD_GUILD_ID", "ANNOUNCE_CHANNEL_ID"]
    .filter((k) => !process.env[k]);
  if (missing.length) console.warn(`⚠️  Missing env vars: ${missing.join(", ")}`);
  const unlinked = JOBS.filter((j) => !roleIdFor(j)).map((j) => roleEnvName(j.id));
  if (unlinked.length) console.warn(`⚠️  Jobs without a Discord role ID (they show their seed holders and can't be claimed): ${unlinked.join(", ")}`);
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.set("trust proxy", 1); // Render/most hosts sit behind a proxy; needed for secure cookies
app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));
app.use(
  cookieSession({
    name: "jobfair",
    keys: [SESSION_SECRET],
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
    secure: PROD,
    httpOnly: true,
  })
);
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(express.static(join(__dirname, "public"), { extensions: ["html"] }));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Discord helpers ─────────────────────────────────────────────────────────
async function discord(path, { method = "GET", body, reason } = {}, attempt = 0) {
  const headers = { Authorization: `Bot ${BOT_TOKEN}` };
  if (body) headers["Content-Type"] = "application/json";
  if (reason) headers["X-Audit-Log-Reason"] = encodeURIComponent(reason);
  const res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 429 && attempt < 2) {
    const info = await res.json().catch(() => ({}));
    await sleep((info.retry_after ?? 1) * 1000 + 150);
    return discord(path, { method, body, reason }, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Discord ${method} ${path} → ${res.status} ${text.slice(0, 300)}`);
    err.status = res.status;
    try { err.code = JSON.parse(text).code; } catch { /* not JSON */ }
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

const defaultAvatar = (id) => {
  try { return `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(id) >> 22n) % 6n)}.png`; }
  catch { return "https://cdn.discordapp.com/embed/avatars/0.png"; }
};
const memberName = (m) => m.nick || m.user.global_name || m.user.username;
const memberAvatar = (m) =>
  m.avatar
    ? `https://cdn.discordapp.com/guilds/${GUILD_ID}/users/${m.user.id}/avatars/${m.avatar}.png?size=96`
    : m.user.avatar
      ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png?size=96`
      : defaultAvatar(m.user.id);

// Guild member list, cached for 30 s. Needs "Server Members Intent" switched on
// in the Discord Developer Portal → Bot.
let membersCache = { at: 0, list: null };
async function guildMembers({ fresh = false } = {}) {
  if (!fresh && membersCache.list && Date.now() - membersCache.at < 30_000) return membersCache.list;
  const all = [];
  let after = "0";
  for (;;) {
    const page = await discord(`/guilds/${GUILD_ID}/members?limit=1000&after=${after}`);
    all.push(...page);
    if (page.length < 1000) break;
    after = page[page.length - 1].user.id;
  }
  membersCache = { at: Date.now(), list: all };
  return all;
}

// ─── Holders ─────────────────────────────────────────────────────────────────
const demoClaims = new Map(); // demo mode only: jobId → [{ id, name, avatar }]

// track: compare with what open pages last saw and push any difference to them.
async function loadHolders({ fresh = false, track = true } = {}) {
  let members = null;
  let warning = null;
  if (!DEMO && discordReady) {
    try {
      members = await guildMembers({ fresh });
    } catch (err) {
      console.error("Could not read server members:", err.message);
      warning = "Live role data is unavailable right now, so this list may be out of date.";
    }
  }
  const map = new Map();
  for (const job of JOBS) {
    const roleId = roleIdFor(job);
    let holders;
    if (DEMO) {
      holders = [...job.seedHolders.map((name) => ({ id: null, name, avatar: null })), ...(demoClaims.get(job.id) || [])];
    } else if (members && roleId) {
      holders = members
        .filter((m) => m.roles.includes(roleId) && !m.user.bot)
        .map((m) => ({ id: m.user.id, name: memberName(m), avatar: memberAvatar(m) }));
    } else {
      holders = job.seedHolders.map((name) => ({ id: null, name, avatar: null }));
    }
    map.set(job.id, holders);
  }
  if (track && members) noteChanges(map);
  return { map, members, warning };
}

function parsePosted(s) {
  const [m, d, y] = s.split("/").map(Number);
  return new Date(2000 + y, m - 1, d);
}

function publicJob(job, index, holders, userId) {
  const isNew = Date.now() - parsePosted(job.posted).getTime() < NEW_WITHIN_DAYS * 86_400_000;
  return {
    id: job.id,
    no: index + 1,
    title: job.title,
    posted: job.posted,
    slots: job.slots,
    priority: job.priority,
    isNew,
    bullets: job.bullets,
    skills: job.skills,
    passScore: job.passScore,
    questionCount: job.interview.length,
    claimable: DEMO || Boolean(roleIdFor(job)),
    holders: holders.map((h) => ({ name: h.name, avatar: h.avatar, me: Boolean(userId && h.id === userId) })),
    open: holders.length < job.slots,
  };
}

const findJob = (id) => JOBS.find((j) => j.id === id);

// ─── Live updates (Server-Sent Events) ─────────────────────────────────────────
// Every open page keeps a connection here. When someone accepts a job, or a CG
// leader changes a role in Discord, all pages refresh their folders.
const streams = new Set();
function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of streams) res.write(msg);
}
// What open pages were last told about: jobId → sorted holder IDs.
let lastSeen = null;
const snapshot = (map) => new Map(JOBS.map((j) => [j.id, (map.get(j.id) || []).map((h) => h.id || h.name).sort()]));

// Called with every fresh read of Discord. If a leader added or removed a role by
// hand, tell every open page which jobs opened up or filled.
function noteChanges(map) {
  const now = snapshot(map);
  if (lastSeen) {
    const reopened = [];
    const filled = [];
    for (const job of JOBS) {
      const before = lastSeen.get(job.id) || [];
      const after = now.get(job.id) || [];
      if (before.join(",") === after.join(",")) continue;
      (after.length < before.length ? reopened : filled).push({ jobId: job.id, title: job.title });
    }
    if (reopened.length || filled.length) broadcast("jobs", { reason: "discord", reopened, filled });
  }
  lastSeen = now;
}

app.get("/api/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("retry: 4000\n\n");
  streams.add(res);
  req.on("close", () => streams.delete(res));
});

// Heartbeat keeps proxies from closing idle connections.
setInterval(() => { for (const res of streams) res.write(": ping\n\n"); }, 20_000).unref();

// Catch role changes made directly in Discord, but only while someone is watching.
setInterval(async () => {
  if (!streams.size || DEMO || !discordReady) return;
  try { await loadHolders({ fresh: true }); } catch { /* try again next round */ }
}, LIVE_CHECK_MS).unref();

// One claim at a time, so two people can't grab the last slot together.
let claimQueue = Promise.resolve();
const serialize = (fn) => {
  const run = claimQueue.then(fn, fn);
  claimQueue = run.catch(() => {});
  return run;
};

async function announce(user, job, openingsLeft) {
  if (!ANNOUNCE_CHANNEL_ID) return false;
  const link = /^https:\/\//.test(BASE_URL) ? `${BASE_URL}/#${job.id}` : undefined;
  await discord(`/channels/${ANNOUNCE_CHANNEL_ID}/messages`, {
    method: "POST",
    body: {
      content: `📣 **OFFER ACCEPTED!** Congratulations <@${user.id}>! 🎉`,
      embeds: [
        {
          title: `Welcome aboard, ${job.title}!`,
          url: link,
          description: `<@${user.id}> aced the interview and accepted the offer for **${job.title}**.\nGive them a warm ${GROUP_NAME} welcome!`,
          color: 0xd9301f,
          thumbnail: user.avatar ? { url: user.avatar } : undefined,
          fields: [
            { name: "Position", value: job.title, inline: true },
            { name: "Openings left", value: String(openingsLeft), inline: true },
          ],
          footer: { text: `${GROUP_NAME} Job Fair 2026` },
          timestamp: new Date().toISOString(),
        },
      ],
      allowed_mentions: { users: [user.id] },
    },
  });
  return true;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
const safeJobHash = (id) => (findJob(id) ? `#${id}` : "");

app.get("/auth/login", (req, res) => {
  const job = String(req.query.job || "");
  if (DEMO) {
    const id = "demo-" + crypto.randomBytes(4).toString("hex");
    req.session.user = { id, name: "Demo Applicant", avatar: null };
    return res.redirect("/?from=login" + safeJobHash(job));
  }
  if (!CLIENT_ID) return res.status(500).send("Discord sign-in isn't configured yet (DISCORD_CLIENT_ID is missing).");
  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauth = { state, job };
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "none",
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

app.get("/auth/callback", wrap(async (req, res) => {
  const { code, state } = req.query;
  const saved = req.session.oauth;
  req.session.oauth = null;
  if (!code || !saved || state !== saved.state) return res.redirect("/");

  const tokenRes = await fetch(`${API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: REDIRECT_URI,
    }),
  });
  const token = await tokenRes.json();
  if (!token.access_token) {
    console.error("OAuth token exchange failed:", token);
    return res.redirect("/");
  }
  const meRes = await fetch(`${API}/users/@me`, { headers: { Authorization: `Bearer ${token.access_token}` } });
  const u = await meRes.json();
  req.session.user = {
    id: u.id,
    name: u.global_name || u.username,
    avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=96` : defaultAvatar(u.id),
  };
  res.redirect("/?from=login" + safeJobHash(saved.job));
}));

app.post("/auth/logout", (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

// ─── API ─────────────────────────────────────────────────────────────────────
app.get("/healthz", (req, res) => res.type("text").send("ok"));

app.get("/api/me", wrap(async (req, res) => {
  const user = req.session.user || null;
  let inServer = true;
  if (user && !DEMO && discordReady) {
    try {
      const members = await guildMembers();
      inServer = members.some((m) => m.user.id === user.id);
    } catch { /* unknown; let accept() decide */ }
  }
  res.json({
    user,
    inServer,
    demo: DEMO,
    groupName: GROUP_NAME,
    discordUrl: GUILD_ID ? `https://discord.com/channels/${GUILD_ID}${ANNOUNCE_CHANNEL_ID ? "/" + ANNOUNCE_CHANNEL_ID : ""}` : "https://discord.com/app",
    maxJobs: MAX_JOBS,
  });
}));

app.get("/api/jobs", wrap(async (req, res) => {
  const userId = req.session.user?.id;
  const { map, warning } = await loadHolders();
  res.set("Cache-Control", "no-store");
  res.json({ jobs: JOBS.map((j, i) => publicJob(j, i, map.get(j.id), userId)), warning });
}));

app.get("/api/jobs/:id/interview", (req, res) => {
  const job = findJob(req.params.id);
  if (!job) return res.status(404).json({ error: "That job doesn't exist." });
  res.json({
    title: job.title,
    passScore: job.passScore,
    questions: job.interview.map(({ q, options }) => ({ q, options })),
  });
});

app.post("/api/jobs/:id/interview", wrap(async (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: "Sign in with Discord to interview." });
  const job = findJob(req.params.id);
  if (!job) return res.status(404).json({ error: "That job doesn't exist." });

  const { map } = await loadHolders();
  const holders = map.get(job.id);
  if (holders.some((h) => h.id === user.id)) return res.status(409).json({ error: "You already hold this job." });
  if (holders.length >= job.slots) return res.status(409).json({ error: "This position was just filled." });

  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  if (answers.length !== job.interview.length) return res.status(400).json({ error: "Answer every question first." });

  const results = job.interview.map((q, i) => Number(answers[i]) === q.answer);
  const score = results.filter(Boolean).length;
  const passed = score >= job.passScore;
  if (passed) req.session.offers = { ...(req.session.offers || {}), [job.id]: Date.now() };
  res.json({ score, total: job.interview.length, passScore: job.passScore, passed, results });
}));

app.post("/api/jobs/:id/accept", wrap(async (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: "Sign in with Discord first." });
  const job = findJob(req.params.id);
  if (!job) return res.status(404).json({ error: "That job doesn't exist." });

  const offeredAt = req.session.offers?.[job.id];
  if (!offeredAt || Date.now() - offeredAt > OFFER_TTL_MS) {
    return res.status(403).json({ error: "Your offer expired. Take the interview again to get a new one." });
  }

  const result = await serialize(async () => {
    const { map, members } = await loadHolders({ fresh: true });
    const holders = map.get(job.id);
    if (holders.some((h) => h.id === user.id)) return { status: 409, error: "You already hold this job." };
    if (holders.length >= job.slots) return { status: 409, error: "Someone accepted the last opening just before you." };
    if (MAX_JOBS) {
      const mine = [...map.values()].filter((list) => list.some((h) => h.id === user.id)).length;
      if (mine >= MAX_JOBS) return { status: 409, error: `Each person can hold up to ${MAX_JOBS} job${MAX_JOBS > 1 ? "s" : ""}.` };
    }

    if (DEMO) {
      demoClaims.set(job.id, [...(demoClaims.get(job.id) || []), { id: user.id, name: user.name, avatar: user.avatar }]);
      const openingsLeft = job.slots - holders.length - 1;
      broadcast("claimed", { jobId: job.id, title: job.title, name: user.name, openingsLeft });
      return { status: 200, announced: false, openingsLeft };
    }

    const roleId = roleIdFor(job);
    if (!roleId) return { status: 503, error: "This job isn't linked to a Discord role yet. Let a CG leader know." };
    if (members && !members.some((m) => m.user.id === user.id)) {
      return { status: 403, error: `Join the ${GROUP_NAME} Discord server first, then come back to accept.` };
    }

    try {
      await discord(`/guilds/${GUILD_ID}/members/${user.id}/roles/${roleId}`, {
        method: "PUT",
        reason: `Job Fair: accepted ${job.title}`,
      });
    } catch (err) {
      console.error("Role assignment failed:", err.message);
      if (err.code === 10011) return { status: 503, error: `This job's Discord role no longer exists. Ask a ${GROUP_NAME} leader to create it again and update the role ID.` };
      if (err.status === 404) return { status: 403, error: `Join the ${GROUP_NAME} Discord server first, then come back to accept.` };
      return { status: 502, error: "Discord didn't accept the role change. Ask a CG leader to check the bot's permissions." };
    }
    // Patch the cached member list so every page sees the new holder right away,
    // even if Discord's member list takes a moment to catch up.
    const cached = membersCache.list?.find((m) => m.user.id === user.id);
    if (cached && !cached.roles.includes(roleId)) cached.roles.push(roleId);
    membersCache.at = Date.now();

    const openingsLeft = Math.max(0, job.slots - holders.length - 1);
    broadcast("claimed", { jobId: job.id, title: job.title, name: user.name, openingsLeft });
    // Pages already know about this claim, so record it as seen.
    lastSeen = snapshot((await loadHolders({ track: false })).map);
    let announced = false;
    try {
      announced = await announce(user, job, openingsLeft);
    } catch (err) {
      console.error("Announcement failed:", err.message);
    }
    return { status: 200, announced, openingsLeft };
  });

  if (result.status !== 200) return res.status(result.status).json({ error: result.error });
  const { offers = {} } = req.session;
  delete offers[job.id];
  req.session.offers = offers;
  res.json({ ok: true, announced: result.announced, openingsLeft: result.openingsLeft });
}));

// ─── Errors ──────────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  if (req.path.startsWith("/api/")) return res.status(500).json({ error: "Something went wrong on our side. Try again in a moment." });
  res.status(500).send("Something went wrong.");
});

app.listen(PORT, () => {
  console.log(`\n📁 Job Fair running on ${BASE_URL}${DEMO ? "  (demo mode: no Discord needed)" : ""}\n`);
});
