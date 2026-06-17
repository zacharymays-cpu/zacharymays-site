// src/lib/intakeDedup.js
// Pure duplicate-ranking for intake. CommonJS so it loads under both Next/webpack
// and bare `node --test`. Normalized exact match scores 1.0; otherwise Dice
// coefficient (string-similarity) on the normalized names. Returns candidates at
// or above threshold, sorted by score desc.
const stringSimilarity = require('string-similarity');
const { normalizeName } = require('./curatorLifecycle');

function rankDuplicates(name, candidates, { threshold = 0.6 } = {}) {
  const key = normalizeName(name);
  if (!key) return [];
  const scored = (candidates || []).map((c) => {
    const ck = normalizeName(c.name);
    const exact = ck === key;
    const score = exact ? 1 : stringSimilarity.compareTwoStrings(key, ck);
    return { ...c, score: Math.round(score * 100) / 100, exact };
  });
  return scored
    .filter((c) => c.exact || c.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

module.exports = { rankDuplicates };
