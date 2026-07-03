// src/lib/scoring.js
// Single source of truth for the three scoring registers ("tracks").
// CommonJS (loads under Next/webpack AND bare `node --test`) — see curatorLifecycle.js.
//
//   young     — Cultiness register  (Young & Reed presence count, 0–10)
//   composite — Neutral register    (intensity-weighted index, 0–100)
//   lifton    — Totalism register   (Lifton C11, 0–10)
//
// The three registers are intentionally distinct and must never share label
// strings. DB still stores old "Super/Kinda/Not Culty" strings for BOTH
// composite_tier and youngs_band; the *_FromDb helpers map them to the right
// register at render time. No DB migration here — display only.
//
// Colors are the single tuning point for tag color across every visualization.
// Values below are the light-mode palette; the dual-mode design-system plan
// later swaps these to CSS custom properties.

const YOUNG_BANDS = [
  { id: 'not',   label: 'Not Culty',   short: 'Not Culty',   color: '#7a9a8c' },
  { id: 'kinda', label: 'Kinda Culty', short: 'Kinda Culty', color: '#c8a84b' },
  { id: 'super', label: 'Super Culty', short: 'Super Culty', color: '#a5432e' },
];

const COMPOSITE_BANDS = [
  { id: 'low',      label: 'Low-Control',      short: 'Low',      color: '#8b9a86' },
  { id: 'moderate', label: 'Moderate-Control', short: 'Moderate', color: '#c08a5a' },
  { id: 'high',     label: 'High-Control',     short: 'High',     color: '#7d3a30' },
];

const LIFTON_BANDS = [
  { id: 'non',             label: 'Non-Totalizing',           short: 'Non-Totalizing', color: '#5f8f86' },
  { id: 'moderately',      label: 'Moderately Totalizing',    short: 'Moderate',       color: '#6d83b5' },
  { id: 'psychologically', label: 'Psychologically Totalizing', short: 'Totalizing',   color: '#a06cd5' },
];

const TRACKS = {
  young:     { key: 'young',     register: 'Cultiness', scoreLabel: "Young's",  unit: '/10',  bands: YOUNG_BANDS },
  composite: { key: 'composite', register: 'Neutral',   scoreLabel: 'Composite', unit: '/100', bands: COMPOSITE_BANDS },
  lifton:    { key: 'lifton',    register: 'Totalism',  scoreLabel: 'Totalism', unit: '/10',  bands: LIFTON_BANDS },
};

function toNum(v) {
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

function classifyYoung(score) {
  const v = toNum(score);
  if (v === null) return null;
  if (v >= 6) return YOUNG_BANDS[2];
  if (v >= 3) return YOUNG_BANDS[1];
  return YOUNG_BANDS[0];
}

function classifyComposite(score) {
  const v = toNum(score);
  if (v === null) return null;
  if (v >= 60) return COMPOSITE_BANDS[2];
  if (v >= 30) return COMPOSITE_BANDS[1];
  return COMPOSITE_BANDS[0];
}

function classifyLifton(score) {
  const v = toNum(score);
  if (v === null) return null;
  if (v >= 6) return LIFTON_BANDS[2];
  if (v >= 3) return LIFTON_BANDS[1];
  return LIFTON_BANDS[0];
}

// Stored DB tier strings → band. Same string set is used for both tiers in the
// DB, but each maps into its own register.
const DB_TIER_TO_ID = { 'Not Culty': 0, 'Kinda Culty': 1, 'Super Culty': 2 };

function compositeBandFromTier(dbTier) {
  const i = DB_TIER_TO_ID[dbTier];
  return i === undefined ? null : COMPOSITE_BANDS[i];
}

// Inverse of compositeBandFromTier: numeric composite score → STORED DB tier
// string, via the canonical 30/60 cut-lines in classifyComposite. Lets writers
// stop hardcoding the cut-lines when assigning organizations.composite_tier.
const BAND_ID_TO_DB_TIER = { low: 'Not Culty', moderate: 'Kinda Culty', high: 'Super Culty' };

function compositeDbTierFromScore(score) {
  const b = classifyComposite(score);
  return b ? BAND_ID_TO_DB_TIER[b.id] : null;
}

function youngBandFromDb(dbBand) {
  const i = DB_TIER_TO_ID[dbBand];
  return i === undefined ? null : YOUNG_BANDS[i];
}

module.exports = {
  TRACKS,
  classifyYoung,
  classifyComposite,
  classifyLifton,
  compositeBandFromTier,
  compositeDbTierFromScore,
  youngBandFromDb,
};
