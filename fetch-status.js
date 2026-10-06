#!/usr/bin/env node
/**
 * fetch-status.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Run by the GitHub Actions workflow every 15 minutes.
 * Fetches every vendor's Statuspage API, then:
 *   • Writes  data/current-status.json  (latest snapshot — HTML reads this)
 *   • Updates data/incident-history.json (cumulative — never shrinks)
 *
 * Requires Node.js 18+ (uses native fetch, no npm packages needed).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const DATA_DIR  = path.join(ROOT, 'data');

// ── Make sure /data exists ──────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Vendor list (must stay in sync with index.html VENDORS array) ───────────
const VENDORS = [
  { id: 'athenahealth',   base: 'https://status.athenahealth.com' },
  { id: 'eclinicalworks', base: 'https://status.eclinicalworks.com' },
  { id: 'practicefusion', base: 'https://status.practicefusion.com' },
  { id: 'tebra',          base: 'https://status.tebra.com' },
  { id: 'drchrono',       base: 'https://status.drchrono.com' },
  { id: 'advancedmd',     base: 'https://status.advancedmd.com' },
  { id: 'nextgen',        base: 'https://nextgen.statuspage.io' },
  { id: 'veradigm',       base: 'https://status.vsuite.veradigmcloud.com' },
  { id: 'greenway',       base: 'https://greenway.statuspage.io' },
  // ModMed / Epic / Oracle Health have no public API — skip
];

const HISTORY_MAX = 100;   // keep the 100 most recent incidents per vendor

// ── Fetch helper ─────────────────────────────────────────────────────────────
async function fetchJSON(url, timeoutMs = 12000) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'EHR-Status-Dashboard/1.0 (internal sales tool)',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchVendor(vendor) {
  const [summary, incidents] = await Promise.all([
    fetchJSON(`${vendor.base}/api/v2/summary.json`),
    fetchJSON(`${vendor.base}/api/v2/incidents.json`),
  ]);
  return {
    status:     summary.status,
    components: summary.components || [],
    incidents:  incidents.incidents || [],
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[${new Date().toISOString()}] Starting status fetch for ${VENDORS.length} vendors…`);

  // Load existing history (so we never lose previously collected incidents)
  const historyPath = path.join(DATA_DIR, 'incident-history.json');
  let history = {};
  if (fs.existsSync(historyPath)) {
    try   { history = JSON.parse(fs.readFileSync(historyPath, 'utf8')); }
    catch { console.warn('Could not parse existing history, starting fresh.'); }
  }

  // Fetch all vendors in parallel
  const settled = await Promise.allSettled(
    VENDORS.map(v =>
      fetchVendor(v)
        .then(data  => ({ id: v.id, data }))
        .catch(err  => ({ id: v.id, error: err.message }))
    )
  );

  const currentSnapshot = {
    generated_at: new Date().toISOString(),
    vendors: {},
  };

  settled.forEach(result => {
    if (result.status !== 'fulfilled') return;
    const { id, data, error } = result.value;

    if (error) {
      console.warn(`  ✗ ${id}: ${error}`);
      currentSnapshot.vendors[id] = { error };
      return;
    }

    console.log(`  ✓ ${id}: ${data.status.indicator} — ${data.status.description}`);

    // Save current state
    currentSnapshot.vendors[id] = {
      status:     data.status,
      components: data.components
        .filter(c => !c.group)  // strip group headers to save space
        .map(c => ({ id: c.id, name: c.name, status: c.status })),
      active_incidents: data.incidents
        .filter(i => i.status !== 'resolved')
        .map(trimIncident),
    };

    // Merge into cumulative history
    if (!history[id]) history[id] = {};
    for (const inc of data.incidents) {
      history[id][inc.id] = trimIncident(inc);
    }

    // Prune to HISTORY_MAX most recent per vendor
    const sorted = Object.values(history[id])
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, HISTORY_MAX);
    history[id] = Object.fromEntries(sorted.map(i => [i.id, i]));
  });

  // Write files atomically (write → rename)
  writeJSON(path.join(DATA_DIR, 'current-status.json'),    currentSnapshot);
  writeJSON(path.join(DATA_DIR, 'incident-history.json'),  history);

  // Summary
  const total    = Object.keys(currentSnapshot.vendors).length;
  const errors   = Object.values(currentSnapshot.vendors).filter(v => v.error).length;
  const outages  = Object.values(currentSnapshot.vendors)
    .filter(v => v.status && ['major','critical'].includes(v.status.indicator)).length;

  console.log(`\nDone. ${total} vendors | ${outages} outages | ${errors} fetch errors.`);
  if (outages > 0) {
    console.log('⚠️  Active outages detected — warm prospecting opportunity!');
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function trimIncident(inc) {
  return {
    id:          inc.id,
    name:        inc.name,
    status:      inc.status,
    impact:      inc.impact,
    created_at:  inc.created_at,
    resolved_at: inc.resolved_at || null,
    shortlink:   inc.shortlink    || null,
    updates: (inc.incident_updates || [])
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3)
      .map(u => ({ body: u.body, created_at: u.created_at, status: u.status })),
  };
}

function writeJSON(filePath, data) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);   // atomic on POSIX
  console.log(`  📄 Wrote ${path.basename(filePath)}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
