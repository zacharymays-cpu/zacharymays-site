// Personnel admin layout: shared header, sticky tabs, and content area
// Matches the curator/review/intake pattern with PersonnelTabs navigation
import Link from 'next/link';
import PersonnelTabs from '@/components/admin/PersonnelTabs';

export default function PersonnelLayout({ children, params }) {
  // Extract tab from URL path, default to 'roster'
  const activeTab = params?.tab || 'roster';

  return (
    <div style={{ minHeight: '100vh', background: '#0f0d0b' }}>
      {/* Header */}
      <header style={{
        background: '#1f1c19',
        borderBottom: '1px solid rgba(244,240,232,0.12)',
        padding: '1.5rem 0',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f4f0e8' }}>
            Personnel Management
          </h1>
          <p style={{
            marginTop: '0.4rem',
            color: 'rgba(244,240,232,0.7)',
            fontSize: '0.9rem',
          }}>
            Manage survivor records, movement tracking, photos, network analysis, and audit logs
          </p>
        </div>
      </header>

      {/* Sticky tab navigation */}
      <div style={{
        background: '#1f1c19',
        borderBottom: '1px solid rgba(244,240,232,0.12)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
          <PersonnelTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              // Navigation is handled via Next.js routing in child pages
              // This component just renders the tabs and styles the active one
            }}
          />
        </div>
      </div>

      {/* Main content area */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {children}
      </main>
    </div>
  );
}
