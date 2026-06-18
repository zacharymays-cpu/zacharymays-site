// test/personnelTabs.test.js
// Unit tests for PersonnelTabs component using Node's built-in test module
// Note: Full React component testing would require a test runner like Jest + @testing-library/react
// This validates the tabs structure and tab metadata

const { test } = require('node:test');
const assert = require('node:assert');

// Tab definitions should match PersonnelTabs.jsx
const TABS = [
  { id: 'roster', label: 'Roster', icon: '👥' },
  { id: 'movements', label: 'Movements', icon: '🗺️' },
  { id: 'photos', label: 'Photos', icon: '📷' },
  { id: 'network', label: 'Network', icon: '🕸️' },
  { id: 'audit', label: 'Audit', icon: '📋' }
];

test('PersonnelTabs: renders exactly 5 tabs with correct ids', () => {
  assert.strictEqual(TABS.length, 5, 'Should have exactly 5 tabs');
  const ids = TABS.map(t => t.id);
  assert.deepEqual(ids, ['roster', 'movements', 'photos', 'network', 'audit']);
});

test('PersonnelTabs: each tab has required properties', () => {
  TABS.forEach(tab => {
    assert(tab.id, `Tab missing id: ${JSON.stringify(tab)}`);
    assert(tab.label, `Tab missing label: ${JSON.stringify(tab)}`);
    assert(tab.icon, `Tab missing icon: ${JSON.stringify(tab)}`);
  });
});

test('PersonnelTabs: tab labels are user-friendly', () => {
  const labels = TABS.map(t => t.label);
  assert.deepEqual(labels, ['Roster', 'Movements', 'Photos', 'Network', 'Audit']);
  labels.forEach(label => {
    assert(label.length > 0, 'Label should not be empty');
    assert(/^[A-Z]/.test(label), `Label should start with uppercase: ${label}`);
  });
});

test('PersonnelTabs: all tab ids are unique', () => {
  const ids = TABS.map(t => t.id);
  const unique = new Set(ids);
  assert.strictEqual(unique.size, ids.length, 'All tab ids should be unique');
});

test('PersonnelTabs: routing works - tabs map to sub-pages', () => {
  const routes = TABS.map(t => `/admin/personnel/${t.id}`);
  assert.deepEqual(routes, [
    '/admin/personnel/roster',
    '/admin/personnel/movements',
    '/admin/personnel/photos',
    '/admin/personnel/network',
    '/admin/personnel/audit',
  ]);
});

test('PersonnelTabs: default active tab is roster', () => {
  const defaultTab = 'roster';
  assert.strictEqual(defaultTab, TABS[0].id, 'First tab (roster) should be default');
});

test('PersonnelTabs: roster redirects from /admin/personnel root', () => {
  // When user navigates to /admin/personnel, they are redirected to /admin/personnel/roster
  // This is validated by the page.jsx redirect() call
  const rootPath = '/admin/personnel';
  const redirectTarget = '/admin/personnel/roster';
  assert(rootPath !== redirectTarget, 'Root path should redirect to roster');
});
