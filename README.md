# GEM Job Fair 2026

A mobile job board for the GEM Discord. Members flip through a drawer of manila folders, open a job to read it, pass a three-question interview, accept the offer, and get the Discord role. The bot posts a congratulations shout-out, and every open page updates on its own: the stamp flips to "Filled", the name tag appears, and the job moves from Open to Filled.

**Try it on your computer first (no Discord setup needed):**

```bash
npm install
npm run demo
```

Open http://localhost:3000. Demo mode fakes sign-in and keeps claims in memory until you stop the server. Open it in two browser windows to watch live updates.

---

## Environment variables

Mostly the same as last year. Copy the role IDs over; get **new** values for the three secrets.

| Variable | Same as last year? | Where to get it |
|---|---|---|
| `DISCORD_CLIENT_ID` | Same | Developer Portal → your app → OAuth2 |
| `DISCORD_CLIENT_SECRET` | **New value** (reset it) | OAuth2 → Reset Secret |
| `DISCORD_BOT_TOKEN` | **New value** (reset it) | Bot → Reset Token |
| `SESSION_SECRET` | **New value** | Render generates it |
| `DISCORD_GUILD_ID` | Same | Right-click the server icon → Copy Server ID |
| `ANNOUNCE_CHANNEL_ID` | Same | Right-click the channel → Copy Channel ID |
| `ROLE_BIRTHDAY_CELEBRATOR` … `ROLE_FIELD_SURVEYOR` | Same 9 IDs | Server Settings → Roles → right-click → Copy Role ID |
| `ROLE_PRAYER_STARTER` | Same ID as last year's Prayer Keeper role | (`ROLE_PRAYER_KEEPER` also works) |
| `ROLE_DIRECTOR_OF_BOARDS`, `ROLE_CHOIRMASTER`, `ROLE_PE_TEACHER`, `ROLE_MARKETING_COORDINATOR` | **New** | Create these 4 roles first |
| `GROUP_NAME` | New, optional | Already set to `GEM` |
| `MAX_JOBS_PER_PERSON` | New, optional | Blank = no limit |
| `REDIRECT_URI` | **Don't copy** | The site works it out from Render's URL now |
| `BASE_URL` | Don't add | Only for a custom domain |

Why new secrets: Railway disclosed a breach on October 21, 2026 in which attackers could read customers' environment variables. Last year's bot token and client secret were stored there.

## Reusing your bot

Yes, if it's the bot from last year's job fair (the one you made in the Discord Developer Portal). Resetting its token gives the same bot a new password; it stays in your server with its role. Then:

1. **Bot page → Server Members Intent: ON.** New this year; the site reads who holds each job from roles.
2. **Server Settings → Roles:** drag the bot's role **above** all 14 job roles.
3. **Announcement channel → permissions:** the bot needs View Channel, Send Messages and **Embed Links** (the shout-out is a card now).

A third-party bot such as Carl-bot, MEE6 or Dyno can't be used, because the site needs a bot token and only that bot's owner has it.

## Deploy on Render, step by step

1. **Reset the secrets.** Developer Portal → your app → Bot → **Reset Token** (copy it). OAuth2 → **Reset Secret** (copy it).
2. **Prepare Discord.** Turn on Server Members Intent. Rename "Prayer Keeper" to "Prayer Starter" (same ID). Create Director of Boards, Choir/Choirmaster, PE Teacher and Marketing Coordinator roles. Drag the bot's role above all job roles. Give the bot Embed Links in the announcement channel. Check current holders have their roles.
3. **Put the code on GitHub.** Make a new private repo, then *Add file → Upload files* and drag in everything from this folder (or push with git).
4. **Create the service.** render.com → sign in with GitHub → **New → Blueprint** → choose the repo. Render reads `render.yaml` and asks for each value from the table above. Click **Apply**. The first deploy takes 2–3 minutes.
5. **Add the sign-in redirect.** Copy your site URL from Render (e.g. `https://gem-job-fair.onrender.com`). Developer Portal → OAuth2 → Redirects → add `https://gem-job-fair.onrender.com/auth/callback`. Remove last year's Railway redirect.
6. **Test.** Open the site and sign in. Current holders should show on their folders. Claim a job with a test account, watch for the shout-out, then remove that role in Discord (the site reopens the job within a minute).
7. **Shut down Railway.** Delete last year's Railway project so its copy of the old variables is gone.

**Free plan:** Render puts a free site to sleep after 15 minutes without visitors, and the next visit takes about a minute. Open it yourself a minute before you announce the fair, or switch to a paid instance to keep it awake.

## How it works

- **Who holds a job** comes straight from Discord roles, so there's no database. Remove someone by removing their role.
- **Live updates:** each open page keeps a connection to the server. A claim reaches everyone in under a second. When a leader adds or removes a role in Discord, open pages update within about 45 seconds, and a note pops up when a job opens up again. A phone that was asleep refreshes when it wakes.
- **Interviews** are graded on the server; answers never reach the browser. Most jobs need 2 of 3 correct; Marketing Coordinator needs all 3.
- **Accepting** an offer within 15 minutes of passing adds the role and posts the shout-out.
- One person can hold more than one job. Set `MAX_JOBS_PER_PERSON` to cap it.
- A job without a role ID shows its holders from `jobs.js` and "Opening soon" instead of the interview.

## Editing jobs

Everything lives in `jobs.js`: titles, bullets, skills, openings, priority stickers and interview questions. `answer` is the position of the correct option, counting from 0. Push to GitHub and Render redeploys.

To add a job, copy an entry, give it a new `id`, and add a matching `ROLE_…` variable in Render (the id in capitals with dashes turned into underscores, so `welcome-team` becomes `ROLE_WELCOME_TEAM`).

## Troubleshooting

| What you see | Fix |
|---|---|
| "Live role data is unavailable" | Turn on Server Members Intent; check the bot is in the server. |
| Sign-in loops back with no name | The Discord redirect must be exactly your Render URL + `/auth/callback`. |
| "Discord didn't accept the role change" | Move the bot's role above the job roles; confirm it has Manage Roles. |
| No shout-out appears | Check `ANNOUNCE_CHANNEL_ID`, and that the bot can send messages and embeds there. |
| "Join the GEM Discord server first" | The person signed in with an account that isn't in the server. |
| A folder says "Opening soon" | That job's `ROLE_…` variable is missing in Render. |

Render → your service → **Logs** prints the exact Discord error for each of these.

## Files

```
server.js      Express server: Discord sign-in, grading, roles, shout-outs, live updates
jobs.js        The 14 jobs and their interviews
public/        The site (one HTML file)
render.yaml    Render blueprint
.env.example   Every setting, with where to find it
```
