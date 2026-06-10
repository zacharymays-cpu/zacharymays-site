#!/usr/bin/env node
/**
 * BAAD Organization Reconciliation Script
 *
 * Matches 395 BAAD organizations to canonical organizations table via multi-tier
 * fuzzy matching (exact → Jaro-Winkler similarity → category+fuzzy).
 *
 * Usage:
 *   node scripts/reconcile-baad-orgs.js              # dry-run (default)
 *   node scripts/reconcile-baad-orgs.js --commit     # apply matches to DB
 *   node scripts/reconcile-baad-orgs.js --verbose    # detailed logging
 */

import { createClient } from '@supabase/supabase-js'
import pkg from 'string-similarity'
import fs from 'fs'
import path from 'path'

const { stringSimilarity } = pkg

const COMMIT = process.argv.includes('--commit')
const VERBOSE = process.argv.includes('--verbose')

const CONFIDENCE_THRESHOLDS = {
  EXACT: 100,
  FUZZY_HIGH: 95,
  FUZZY_MID: 85,
  FUZZY_LOW: 75,
  CATEGORY_FUZZY: 70,
}

// ─────────────────────────────────────────────────────────────────────────
// Initialize Supabase client
// ─────────────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  return createClient(url, key)
}

// ─────────────────────────────────────────────────────────────────────────
// Matching strategies
// ─────────────────────────────────────────────────────────────────────────

function normalizeOrgName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .trim()
    .replace(/['"']/g, '') // remove quotes
    .replace(/\s+/g, ' ')  // normalize whitespace
}

function exactMatch(baadName, canonicalOrgs) {
  const normalized = normalizeOrgName(baadName)
  if (!normalized) return null

  const match = canonicalOrgs.find(
    org => normalizeOrgName(org.name) === normalized
  )

  return match
    ? { org: match, confidence: CONFIDENCE_THRESHOLDS.EXACT, method: 'exact' }
    : null
}

function fuzzyMatch(baadName, canonicalOrgs, minConfidence = 85) {
  const normalized = normalizeOrgName(baadName)
  if (!normalized) return null

  const candidates = canonicalOrgs
    .map(org => {
      const similarity = stringSimilarity(normalized, normalizeOrgName(org.name))
      const confidence = Math.round(similarity * 100)
      return { org, confidence, method: 'fuzzy' }
    })
    .filter(c => c.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence)

  return candidates.length > 0 ? candidates[0] : null
}

function categoryFuzzyMatch(baadName, baadCategory, canonicalOrgs, minConfidence = 70) {
  const normalized = normalizeOrgName(baadName)
  if (!normalized || !baadCategory) return null

  // Filter by category first
  const sameCategory = canonicalOrgs.filter(org => org.category === baadCategory)
  if (sameCategory.length === 0) return null

  const candidates = sameCategory
    .map(org => {
      const similarity = stringSimilarity(normalized, normalizeOrgName(org.name))
      const confidence = Math.round(similarity * 100)
      return { org, confidence, method: 'category+fuzzy' }
    })
    .filter(c => c.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence)

  return candidates.length > 0 ? candidates[0] : null
}

// ─────────────────────────────────────────────────────────────────────────
// Reconciliation pipeline
// ─────────────────────────────────────────────────────────────────────────

async function reconcileBAASOrgs() {
  console.log('🔄 Starting BAAD reconciliation...\n')

  const supabase = getSupabase()

  // Fetch BAAD external entities
  console.log('📥 Fetching 395 BAAD organizations from external_entity_ids...')
  const { data: baadOrgs, error: baadError } = await supabase
    .from('external_entity_ids')
    .select('*')
    .eq('source_key', 'baad')
    .eq('entity_type', 'organization')
    .is('internal_entity_id', null) // Only unmatched

  if (baadError || !baadOrgs) {
    console.error('❌ Failed to fetch BAAD orgs:', baadError?.message)
    process.exit(1)
  }

  console.log(`✓ Fetched ${baadOrgs.length} unmatched BAAD orgs\n`)

  // Fetch canonical organizations
  console.log('📥 Fetching canonical organizations...')
  const { data: canonicalOrgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, category')

  if (orgError || !canonicalOrgs) {
    console.error('❌ Failed to fetch canonical orgs:', orgError?.message)
    process.exit(1)
  }

  console.log(`✓ Fetched ${canonicalOrgs.length} canonical organizations\n`)

  // Run matching pipeline
  console.log('🔍 Running matching pipeline...\n')

  const results = {
    matched: [],
    unmatched: [],
    confidenceDistribution: {},
  }

  for (let i = 0; i < baadOrgs.length; i++) {
    const baadOrg = baadOrgs[i]
    const baadName = baadOrg.external_name || baadOrg.external_id

    // Try exact match first
    let match = exactMatch(baadName, canonicalOrgs)
    if (!match) {
      // Try fuzzy match (high confidence)
      match = fuzzyMatch(baadName, canonicalOrgs, CONFIDENCE_THRESHOLDS.FUZZY_HIGH)
    }

    if (match) {
      results.matched.push({
        baadOrg,
        canonicalOrg: match.org,
        confidence: match.confidence,
        method: match.method,
      })

      if (VERBOSE) {
        console.log(
          `  ✓ ${baadName.substring(0, 40).padEnd(40)} → ${match.org.name.substring(0, 30)} (${match.confidence}% ${match.method})`
        )
      }
    } else {
      results.unmatched.push(baadOrg)
      if (VERBOSE) {
        console.log(`  ✗ ${baadName.substring(0, 40).padEnd(40)} → NO MATCH`)
      }
    }

    // Track confidence distribution
    if (match) {
      const conf = match.confidence
      results.confidenceDistribution[conf] = (results.confidenceDistribution[conf] || 0) + 1
    }

    // Progress indicator
    if ((i + 1) % 50 === 0) {
      console.log(`  [${i + 1}/${baadOrgs.length}] ...`)
    }
  }

  console.log('\n📊 Results:\n')
  console.log(`  Matched:   ${results.matched.length}/${baadOrgs.length} (${Math.round((results.matched.length / baadOrgs.length) * 100)}%)`)
  console.log(`  Unmatched: ${results.unmatched.length}/${baadOrgs.length} (${Math.round((results.unmatched.length / baadOrgs.length) * 100)}%)\n`)

  console.log('Confidence Distribution:')
  Object.entries(results.confidenceDistribution)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .forEach(([conf, count]) => {
      const bar = '█'.repeat(Math.round((count / results.matched.length) * 30))
      console.log(`  ${conf}%: ${bar} ${count}`)
    })

  // If --commit, write matches to DB
  if (COMMIT) {
    console.log('\n💾 Committing matches to database...')
    await commitMatches(supabase, results.matched)
  } else {
    console.log('\n⚠️  Dry-run mode. Use --commit to apply changes.')
    console.log('   Example: node scripts/reconcile-baad-orgs.js --commit\n')
  }

  // Save report
  const reportPath = `baad-reconciliation-${new Date().toISOString().split('T')[0]}.json`
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        matched: results.matched.length,
        unmatched: results.unmatched.length,
        confidenceDistribution: results.confidenceDistribution,
        unmatched_ids: results.unmatched.map(o => ({ external_id: o.external_id, external_name: o.external_name })),
      },
      null,
      2
    )
  )
  console.log(`📄 Report saved to ${reportPath}\n`)
}

async function commitMatches(supabase, matches) {
  let successful = 0
  let failed = 0

  for (const match of matches) {
    try {
      const { error } = await supabase
        .from('external_entity_ids')
        .update({
          internal_entity_id: match.canonicalOrg.id,
          match_status: 'matched',
          match_confidence: match.confidence,
          // match_method: match.method, // if this column exists
          updated_at: new Date().toISOString(),
        })
        .eq('source_key', 'baad')
        .eq('entity_type', 'organization')
        .eq('external_id', match.baadOrg.external_id)

      if (error) {
        console.error(
          `❌ Failed to update ${match.baadOrg.external_id}: ${error.message}`
        )
        failed++
      } else {
        successful++
        if (VERBOSE) {
          console.log(`✓ Updated ${match.baadOrg.external_id}`)
        }
      }
    } catch (e) {
      console.error(`❌ Exception: ${e.message}`)
      failed++
    }

    // Progress
    if ((successful + failed) % 50 === 0) {
      console.log(`  [${successful + failed}/${matches.length}] ...`)
    }
  }

  console.log(`\n✓ Successfully committed ${successful} matches`)
  if (failed > 0) {
    console.log(`⚠️  Failed to commit ${failed} matches`)
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────

reconcileBAASOrgs().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
