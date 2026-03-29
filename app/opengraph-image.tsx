import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'WITIA — Making Procurement Corruption Economically Irrational'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#F7F6F3',
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 96px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Top border accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#000' }} />

        {/* Logo */}
        <div style={{
          fontSize: '14px',
          fontFamily: 'sans-serif',
          fontWeight: 600,
          letterSpacing: '0.15em',
          color: '#000',
          marginBottom: '48px',
          display: 'flex',
        }}>
          WITIA
        </div>

        {/* Headline */}
        <div style={{
          fontSize: '64px',
          fontWeight: 400,
          lineHeight: 1.1,
          color: '#000',
          maxWidth: '800px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          Making procurement corruption economically irrational.
        </div>

        {/* Subline */}
        <div style={{
          marginTop: '32px',
          fontSize: '20px',
          color: '#555',
          fontFamily: 'sans-serif',
          fontWeight: 400,
          display: 'flex',
        }}>
          AI-powered trust layer for government procurement.
        </div>

        {/* Bottom */}
        <div style={{
          position: 'absolute',
          bottom: '48px',
          left: '96px',
          right: '96px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #E0E0E0',
          paddingTop: '20px',
        }}>
          <span style={{ fontSize: '13px', color: '#888', fontFamily: 'sans-serif', display: 'flex' }}>witia.ai</span>
          <span style={{ fontSize: '13px', color: '#888', fontFamily: 'sans-serif', display: 'flex' }}>Built by Award Winning Cambridge Alum · Backed by Emergent Ventures</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
