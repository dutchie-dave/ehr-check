# EHR Status Intelligence Dashboard
### Sales prospecting tool — live & historical EHR platform health

---

## What this does

Opens a single web page that shows the current status of 12 major EHR vendors (9 with live data, 3 noted as having no public feed). Any vendor experiencing an outage is flagged in red with a ready-to-use outreach opener. Recent incidents stay visible even after they resolve, so "was down three days ago" remains a valid conversation starter.

**Data is pulled directly from each vendor's public Atlassian Statuspage API** — no server required for the live data. Incident history is saved locally so it persists across browser sessions.

---

## Files in this project

```
ehr-status-dashboard/
├── index.html                          ← The dashboard (open this in a browser)
├── scripts/
│   └── fetch-status.js                 ← Node.js script (for GitHub Actions only)
├── .github/
│   └── workflows/
│       └── fetch-status.yml            ← Scheduled job (for GitHub Actions only)
└── README.md                           ← This file
```

---

## Setup Option A — Standalone (simplest, zero cost)

> **Best for:** a single rep, or a team that doesn't need shared history.

1. **Download** `index.html` to your computer.
2. **Double-click** it to open in any browser (Chrome, Edge, Firefox, Safari).
3. That's it. The page calls each vendor's status API directly from your browser.

**What you get:**
- Live status every 5 minutes
- Incident history stored in *your* browser — it accumulates over time
- Works completely offline once the page is loaded (except for refreshes)

**Limitation:** History lives in your browser's local storage. Clearing your browser data or opening the page in a different browser starts fresh. Use Option B to share history across your team.

---

## Setup Option B — GitHub Pages (team-shared + permanent history)

> **Best for:** a whole sales team, shared history that never disappears, automatic background updates every 15 minutes.

This takes about 20 minutes and is completely free.

### Step 1 — Create a GitHub account

Go to [github.com](https://github.com) and sign up for a free account if you don't have one.

### Step 2 — Create a new repository

1. Click the **+** icon (top-right) → **New repository**
2. Name it something like `ehr-status-dashboard`
3. Set visibility to **Private** (so competitors don't see your prospecting tool)
4. Click **Create repository**

### Step 3 — Upload the files

1. On the repository page, click **Add file → Upload files**
2. Upload all three items:
   - `index.html`
   - The `scripts/` folder (containing `fetch-status.js`)
   - The `.github/` folder (containing the `workflows/` subfolder)
   
   > **Tip on hidden folders:** `.github` starts with a dot and may be invisible on your computer. On a Mac, press **⌘ + Shift + .** in Finder to show hidden files. On Windows, enable "Show hidden items" in File Explorer's View menu.

3. Click **Commit changes**

### Step 4 — Enable GitHub Pages

1. In your repository, click **Settings** (tab at the top)
2. Scroll down and click **Pages** (left sidebar)
3. Under **Source**, select **GitHub Actions**
4. Click **Save**

### Step 5 — Run the workflow for the first time

1. Click the **Actions** tab in your repository
2. You'll see "Fetch EHR Status" in the list — click it
3. Click **Run workflow → Run workflow** (green button)
4. Wait about 30 seconds for it to finish (a green checkmark means success)

### Step 6 — Bookmark your dashboard

After the first run, your dashboard is live at:
```
https://YOUR-GITHUB-USERNAME.github.io/ehr-status-dashboard/
```
Replace `YOUR-GITHUB-USERNAME` with your actual GitHub username.

Bookmark this URL and share it with your team. The page auto-updates every 15 minutes in the background.

---

## What each status indicator means

| Indicator | What it means for prospecting |
|-----------|-------------------------------|
| 🔥 **Live Outage** (red card) | Platform is actively down right now. Highest-priority prospect. Call today. |
| ⚡ **Recent Down** (amber card) | Platform had an outage in the last 3 days. Pain is fresh. Follow up today or tomorrow. |
| 📅 **7-Day Issue** (yellow badge) | Incident in the last 7 days. Still a valid opener — most practices remember a recent outage. |
| **Prospect** (gray badge) | No recent issues, but still a target. Good for relationship-building outreach. |
| **Your Platform** (blue badge) | athenahealth — shown for competitive reference only. |
| **No Public Feed** (gray card) | Epic, Oracle Health, and ModMed don't publish a public status API. Check manually via the provided link. |

---

## Vendor coverage and data reliability

| Vendor | Status URL | Live Data? | Notes |
|--------|-----------|-----------|-------|
| athenahealth | status.athenahealth.com | ✅ Full API | Your platform |
| eClinicalWorks | status.eclinicalworks.com | ✅ Full API | May occasionally block fetches |
| Practice Fusion | status.practicefusion.com | ✅ Full API | |
| Tebra (Kareo) | status.tebra.com | ✅ Full API | Rebranded from Kareo |
| DrChrono | status.drchrono.com | ✅ Full API | |
| AdvancedMD | status.advancedmd.com | ✅ Full API | |
| NextGen Healthcare | nextgen.statuspage.io | ✅ Full API | |
| Veradigm (Allscripts) | status.vsuite.veradigmcloud.com | ✅ Full API | EHR/vSuite product line |
| Greenway Health | greenway.statuspage.io | ✅ Full API | Intergy + Prime Suite |
| ModMed | modmed.com/support | ❌ No public feed | Manual check only |
| Epic Systems | userweb.epic.com | ❌ Login-gated | Client-specific; no public API |
| Oracle Health/Cerner | status.oraclehealth.com | ❌ Login-gated | Client-specific; no public API |

### For Epic, Oracle Health, and ModMed
These vendors communicate outages privately to their clients. Your best sources:
- **Ask your champion**: "Has your system been down or slow lately?" is a natural, non-technical question.
- **Third-party monitoring**: Set up a free [UptimeRobot](https://uptimerobot.com) monitor pointing at their patient portal or login page. You'll get email alerts when it goes down.
- **Social listening**: Search Twitter/X for `"[vendor name]" down` — practices complain publicly during outages.

---

## Adjusting the vendor list

Open `index.html` in a text editor (Notepad on Windows, TextEdit on Mac). Find the line near the top of the `<script>` section that says:

```javascript
const VENDORS = [
```

Each vendor is a block like this:

```javascript
{
  id:           'tebra',
  name:         'Tebra (Kareo)',
  description:  'EHR + billing for independent practices',
  emoji:        '📋',
  accent:       '#0891b2',          // color for the card border/icon
  statusBase:   'https://status.tebra.com',
  statusPageUrl:'https://status.tebra.com',
  type:         'statuspage',       // 'statuspage' or 'none'
  isOwn:        false,
  isTarget:     true,               // true = show sales badge + outreach opener
  noFeedNote:   null,
},
```

**To remove a vendor:** delete its entire block (from `{` to `},`).

**To add a vendor:** copy an existing block, paste it, and update the fields. If the vendor doesn't have a public Statuspage, set `type: 'none'` and fill in `noFeedNote`.

---

## Customizing the outreach opener text

The opener is generated automatically from the incident details (vendor name, date, duration). To change the template, find the `salesOpener()` function in `index.html` and edit the template strings. Look for lines like:

```javascript
return `Hi [First Name], I noticed ${vName} is experiencing a live outage...`;
```

---

## Refresh frequency

| Setup | Refresh interval |
|-------|-----------------|
| Standalone (browser) | Every 5 minutes while the tab is open |
| GitHub Actions | Every 15 minutes, 24/7, even when no one has the page open |

To change the GitHub Actions frequency, edit `.github/workflows/fetch-status.yml` and change the `cron` value. For example:
- Every 10 minutes: `*/10 * * * *`
- Every 30 minutes: `*/30 * * * *`

> GitHub's minimum for scheduled Actions is 5 minutes. Note that very high-frequency polling (< 10 min) across 9 vendors is fine — these are public status APIs with no rate limits for reasonable usage.

---

## Decisions you should weigh in on

1. **Who gets access?** If you use GitHub Pages with a private repo, GitHub requires a paid plan (GitHub Pro / Team) to get Pages on private repos. Two alternatives: use a public repo (competitors can technically find it, though it's unlikely) or host the HTML on SharePoint/Google Drive instead.

2. **Team notifications:** The dashboard doesn't send alerts. If you want an email when a competitor goes down, set up a free [Better Uptime](https://betteruptime.com) or [UptimeRobot](https://uptimerobot.com) monitor on each vendor's status URL. Both have free tiers and email/Slack notifications.

3. **Tracking history over time:** The GitHub Actions version preserves full history forever in `data/incident-history.json`. The standalone version stores it in your browser's local storage — clearing your browser data erases it. If long-term history matters, use Option B.

4. **Sharing mid-meeting:** The standalone HTML file can be attached to an email or saved to SharePoint so anyone can open it. Because it calls APIs live, it always shows current data.

---

## Troubleshooting

**Cards show "Fetch failed"**
Some corporate networks or browser extensions (ad blockers, strict CORS policies) can block requests to external APIs. Try:
- Opening the file in a different browser
- Disabling browser extensions temporarily
- Using the GitHub Pages version instead (the GitHub Actions server-side fetch bypasses browser CORS restrictions entirely)

**GitHub Actions isn't running**
GitHub pauses scheduled workflows on inactive repositories after 60 days. Go to **Actions → Fetch EHR Status → Enable workflow** to re-enable it, or trigger a manual run.

**The status page for a vendor changed**
Vendors occasionally move their status pages. Find the vendor's block in `index.html`, update the `statusBase` URL, and save. If the new URL isn't on Statuspage, change `type` to `'none'`.

---

*Built for internal sales use. Always verify directly before referencing vendor outages in customer conversations.*
