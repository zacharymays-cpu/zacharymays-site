// .github/scripts/audit-counts.mjs
//
// Scans source files for hardcoded dataset count references and compares
// them against the live database values from LIVE_STATS env var.
//
// Exit 0 = all good
// Exit 1 = mismatches found (fails the CI check)

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

// ─── Parse live stats from environment ─────────────────────────────────────
const liveStats = JSON.parse(process.env.LIVE_STATS ?? '{}')

const EXPECTED = {
  active_orgs: liveStats.active_orgs,
  calibration_anchors: liveStats.calibration_anchors,
  total_assessed: liveStats.total_assessed,
  analytics_dataset: liveStats.analytics_dataset,
}

console.log('Live DB values:', EXPECTED)

// ─── Patterns to detect hardcoded counts ───────────────────────────────────
// Each rule: find a number near a keyword, check it matches the DB value.
const RULES = [
  {
    name: 'active_orgs (near "organizations")',
    // Matches: "370 organizations", "370 American organizations", "370 active"
    pattern: /(\d{3,4})\s+(American\s+)?organizations/gi,
    expected: EXPECTED.active_orgs,
    description: 'active organizations assessed',
  },
  {
    name: 'calibration_anchors (near "calibration anchors" or "anchors")',
    pattern: /(\d{2,3})\s+(calibration\s+)?anchors/gi,
    expected: EXPECTED.calibration_anchors,
    description: 'calibration anchors',
  },
  {
    name: 'total_assessed (near "total" + "assessed")',
    pattern: /(\d{3,4})\s+total/gi,
    expected: EXPECTED.total_assessed,
    description: 'total assessed',
  },
]

// ─── Files to scan ──────────────────────────────────────────────────────────
const SCAN_EXTENSIONS = new Set(['.tsx', '.ts', '.js', '.jsx', '.md', '.mdx'])
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.github'])

function collectFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) files.push(...collectFiles(full))
    else if (SCAN_EXTENSIONS.has(extname(entry))) files.push(full)
  }
  return files
}

const files = collectFiles('.')
console.log(`Scanning ${files.length} source files...`)

// ─── Run audit ──────────────────────────────────────────────────────────────
const findings = []   // { file, line, matched, expected, rule }

for (const filepath of files) {
  const content = readFileSync(filepath, 'utf8')
  const lines = content.split('\n')

  for (const rule of RULES) {
    if (rule.expected === undefined) continue   // stat not available, skip

    for (let i = 0; i < lines.length; i++) {
      rule.pattern.lastIndex = 0
      if (lines[i].includes("// audit-ignore")) continue
      let match
      while ((match = rule.pattern.exec(lines[i])) !== null) {
        const found = parseInt(match[1], 10)
        if (found !== rule.expected) {
          findings.push({
            file: filepath,
            line: i + 1,
            matched: found,
            expected: rule.expected,
            rule: rule.name,
            context: lines[i].trim().slice(0, 120),
          })
        }
      }
    }
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────
const timestamp = new Date().toISOString()
const methodologyVersion = liveStats.current_methodology_version ?? 'unknown'
const lastUpdated = liveStats.last_updated_at
  ? new Date(liveStats.last_updated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  : 'unknown'

let report = `# Dataset Count Audit — ${timestamp}\n\n`
report += `**Database state:** ${EXPECTED.active_orgs} active orgs · ${EXPECTED.calibration_anchors} calibration anchors · ${EXPECTED.total_assessed} total assessed\n`
report += `**Methodology:** ${methodologyVersion} · Last updated: ${lastUpdated}\n\n`

if (findings.length === 0) {
  report += `✅ All hardcoded counts match the live database. No action required.\n`
  console.log('\n✅ Audit passed — all counts consistent with live DB.')
  writeFileSync('/tmp/audit-report.md', report)
  process.exit(0)
} else {
  report += `## ⚠️ ${findings.length} Hardcoded Count Discrepanc${findings.length === 1 ? 'y' : 'ies'} Found\n\n`
  report += `These numbers in source files do not match the live database. `
  report += `Replace them with the \`<LiveStats>\` component or \`fetchDatasetStats()\`.\n\n`

  for (const f of findings) {
    report += `### \`${f.file}:${f.line}\`\n`
    report += `- **Rule:** ${f.rule}\n`
    report += `- **Found:** \`${f.matched}\` — **Expected:** \`${f.expected}\`\n`
    report += `- **Context:** \`${f.context}\`\n\n`
  }

  report += `---\n`
  report += `**Fix:** Replace hardcoded numbers with the \`<LiveStats>\` component:\n`
  report += `\`\`\`tsx\n// In a Server Component page.tsx:\nimport { LiveStats } from '@/components/LiveStats'\n// ...\n<LiveStats variant="full" />\n\`\`\`\n`
  report += `Or for inline use: \`<LiveStats variant="inline" />\` renders just the number.\n`

  console.error(`\n⚠️ Audit failed — ${findings.length} discrepancy(ies) found:\n`)
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line} — found ${f.matched}, expected ${f.expected} (${f.rule})`)
  }

  writeFileSync('/tmp/audit-report.md', report)
  process.exit(1)
}
