import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --ink:    #0B1F14;
          --ink2:   #1A3525;
          --em:     #10b981;
          --em-lt:  #34d399;
          --sand:   #F7F5F0;
          --sand2:  #EDE9E1;
          --muted:  #6B7E6E;
          --border: rgba(11,31,20,0.10);
        }

        .lp-body {
          font-family: 'DM Sans', system-ui, sans-serif;
          background: var(--sand);
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          min-height: 100vh;
        }

        /* ── NAV ── */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 64px;
          display: flex; align-items: center;
          padding: 0 32px;
          justify-content: space-between;
          background: rgba(247,245,240,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }

        .lp-logo {
          display: flex; align-items: center; gap: 9px;
          text-decoration: none;
        }
        .lp-logo-mark {
          width: 30px; height: 30px; border-radius: 8px;
          background: var(--ink);
          display: flex; align-items: center; justify-content: center;
        }
        .lp-logo-mark svg { width: 15px; height: 15px; stroke: #fff; fill: none; stroke-width: 2.5; stroke-linecap: round; }
        .lp-logo-text {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: 20px; color: var(--ink); letter-spacing: -0.3px;
        }

        .lp-nav-actions { display: flex; align-items: center; gap: 10px; }

        .lp-btn-ghost {
          padding: 8px 18px; border-radius: 10px;
          border: 1.5px solid var(--border);
          background: transparent; color: var(--ink);
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; font-weight: 500;
          text-decoration: none; cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .lp-btn-ghost:hover { border-color: var(--ink); background: rgba(11,31,20,0.04); }

        .lp-btn-solid {
          padding: 8px 20px; border-radius: 10px;
          background: var(--ink); color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; font-weight: 600;
          text-decoration: none; cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          border: none;
        }
        .lp-btn-solid:hover { background: var(--ink2); transform: translateY(-1px); }

        /* ── HERO ── */
        .lp-hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 120px 24px 80px;
          position: relative;
          overflow: hidden;
        }

        /* grid bg */
        .lp-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(11,31,20,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11,31,20,0.055) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 100%);
        }

        /* radial glow */
        .lp-glow {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -60%);
          z-index: 0;
          pointer-events: none;
        }

        .lp-hero-inner {
          position: relative; z-index: 1;
          max-width: 800px;
        }

        .lp-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(16,185,129,0.10);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 50px; padding: 6px 14px;
          margin-bottom: 32px;
          font-size: 11.5px; font-weight: 600;
          letter-spacing: 0.5px; color: #059669;
        }
        .lp-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #10b981;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }

        .lp-h1 {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(3rem, 7vw, 5.5rem);
          line-height: 1.05;
          letter-spacing: -2px;
          color: var(--ink);
          margin-bottom: 24px;
        }
        .lp-h1 em {
          font-style: italic;
          color: var(--ink);
          position: relative;
        }
        .lp-h1 em::after {
          content: '';
          position: absolute; left: 0; right: 0; bottom: 2px;
          height: 2px; border-radius: 2px;
          background: var(--em);
        }

        .lp-sub {
          font-size: 17px; line-height: 1.75;
          color: var(--muted); max-width: 520px;
          margin: 0 auto 40px;
          font-weight: 400;
        }

        .lp-hero-btns {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          margin-bottom: 64px;
        }

        .lp-cta-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 14px;
          background: var(--ink); color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 600;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 8px 24px rgba(11,31,20,0.20);
        }
        .lp-cta-primary:hover { background: var(--ink2); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(11,31,20,0.25); }
        .lp-cta-primary svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; }

        .lp-cta-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 14px;
          background: transparent; color: var(--ink);
          border: 1.5px solid var(--border);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 500;
          text-decoration: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .lp-cta-secondary:hover { border-color: var(--ink); background: rgba(11,31,20,0.04); }

        /* ── SOCIAL PROOF ── */
        .lp-proof {
          display: flex; align-items: center; justify-content: center; gap: 20px;
          flex-wrap: wrap;
        }
        .lp-proof-item {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: var(--muted);
        }
        .lp-proof-item svg { width: 15px; height: 15px; stroke: var(--em); fill: none; stroke-width: 2.5; stroke-linecap: round; }
        .lp-proof-divider { width: 1px; height: 16px; background: var(--border); }

        /* ── DASHBOARD PREVIEW ── */
        .lp-preview {
          padding: 0 24px 100px;
          max-width: 1100px;
          margin: 0 auto;
          position: relative; z-index: 1;
        }

        .lp-preview-frame {
          background: #fff;
          border: 1.5px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(11,31,20,0.12), 0 2px 8px rgba(11,31,20,0.06);
        }

        .lp-preview-bar {
          background: var(--sand); border-bottom: 1px solid var(--border);
          padding: 12px 20px; display: flex; align-items: center; gap: 12px;
        }
        .lp-dots { display: flex; gap: 6px; }
        .lp-dots span { width: 11px; height: 11px; border-radius: 50%; }
        .lp-dots span:nth-child(1) { background: #FF5F57; }
        .lp-dots span:nth-child(2) { background: #FEBC2E; }
        .lp-dots span:nth-child(3) { background: #28C840; }
        .lp-url {
          flex: 1; background: var(--sand2); border: 1px solid var(--border);
          border-radius: 6px; padding: 5px 12px;
          font-size: 11.5px; color: var(--muted); font-family: monospace;
          max-width: 300px; margin: 0 auto;
        }

        /* Fake dashboard content */
        .lp-dash {
          display: grid; grid-template-columns: 220px 1fr;
          min-height: 480px;
        }

        .lp-dash-sidebar {
          background: var(--ink); padding: 20px 16px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .lp-dash-logo {
          font-family: 'Instrument Serif', serif;
          font-size: 16px; color: #fff;
          padding: 8px 12px; margin-bottom: 12px;
          opacity: 0.9;
        }
        .lp-dash-item {
          padding: 9px 12px; border-radius: 8px;
          font-size: 12.5px; color: rgba(255,255,255,0.5);
          display: flex; align-items: center; gap: 9px;
          cursor: default;
        }
        .lp-dash-item.active {
          background: rgba(255,255,255,0.10);
          color: #fff;
        }
        .lp-dash-item svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; flex-shrink: 0; }

        .lp-dash-main { padding: 24px; background: var(--sand); }
        .lp-dash-topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .lp-dash-title { font-size: 15px; font-weight: 700; color: var(--ink); }
        .lp-dash-pill {
          padding: 5px 12px; border-radius: 20px;
          background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25);
          font-size: 11px; font-weight: 600; color: #059669;
          display: flex; align-items: center; gap: 5px;
        }
        .lp-dash-pill::before { content:''; width:5px; height:5px; border-radius:50%; background:#10b981; display:block; }

        .lp-dash-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
          margin-bottom: 20px;
        }
        .lp-stat {
          background: #fff; border: 1px solid var(--border);
          border-radius: 12px; padding: 16px;
        }
        .lp-stat-num { font-size: 22px; font-weight: 800; color: var(--ink); line-height: 1; margin-bottom: 4px; }
        .lp-stat-label { font-size: 11px; color: var(--muted); }
        .lp-stat-up { font-size: 10px; color: #10b981; font-weight: 600; margin-top: 2px; }

        .lp-dash-listings { display: flex; flex-direction: column; gap: 8px; }
        .lp-listing {
          background: #fff; border: 1px solid var(--border);
          border-radius: 10px; padding: 12px 16px;
          display: flex; align-items: center; gap: 14px;
        }
        .lp-listing-thumb {
          width: 40px; height: 40px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .lp-listing-info { flex: 1; min-width: 0; }
        .lp-listing-title { font-size: 12.5px; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
        .lp-listing-sub { font-size: 11px; color: var(--muted); }
        .lp-listing-price { font-size: 12.5px; font-weight: 700; color: var(--ink); white-space: nowrap; }
        .lp-listing-badge {
          font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 6px;
          white-space: nowrap;
        }
        .lp-badge-new { background: rgba(16,185,129,0.12); color: #059669; }
        .lp-badge-hot { background: rgba(239,68,68,0.10); color: #dc2626; }
        .lp-badge-pending { background: rgba(245,158,11,0.10); color: #d97706; }

        /* ── FEATURES ── */
        .lp-features {
          padding: 100px 24px;
          max-width: 1100px; margin: 0 auto;
        }

        .lp-section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; color: var(--em);
          margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .lp-section-label::before {
          content: ''; width: 20px; height: 2px;
          background: var(--em); border-radius: 2px; display: block;
        }

        .lp-section-title {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.1; letter-spacing: -1px;
          color: var(--ink); margin-bottom: 16px;
        }

        .lp-section-sub {
          font-size: 16px; color: var(--muted); line-height: 1.75;
          max-width: 520px; margin-bottom: 56px;
        }

        .lp-feat-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
        }

        .lp-feat-card {
          background: #fff; border: 1.5px solid var(--border);
          border-radius: 18px; padding: 28px;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          cursor: default;
        }
        .lp-feat-card:hover {
          border-color: rgba(11,31,20,0.25);
          transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(11,31,20,0.08);
        }

        .lp-feat-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: var(--sand2);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
        }
        .lp-feat-icon svg { width: 20px; height: 20px; stroke: var(--ink); fill: none; stroke-width: 2; stroke-linecap: round; }

        .lp-feat-name { font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
        .lp-feat-desc { font-size: 13.5px; color: var(--muted); line-height: 1.7; }

        /* ── CTA STRIP ── */
        .lp-cta-strip {
          margin: 0 24px 100px;
          max-width: 1100px;
          margin-left: auto; margin-right: auto;
          background: var(--ink);
          border-radius: 24px;
          padding: 72px 56px;
          text-align: center;
          position: relative; overflow: hidden;
        }

        .lp-cta-orb {
          position: absolute; border-radius: 50%; pointer-events: none;
          filter: blur(60px);
        }
        .lp-cta-orb-1 { width: 300px; height: 300px; top: -80px; right: -60px; background: rgba(16,185,129,0.15); }
        .lp-cta-orb-2 { width: 250px; height: 250px; bottom: -60px; left: -40px; background: rgba(52,211,153,0.10); }

        .lp-cta-inner { position: relative; z-index: 1; }

        .lp-cta-h2 {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(2rem, 4vw, 3rem);
          color: #fff; line-height: 1.1;
          letter-spacing: -1px; margin-bottom: 16px;
        }
        .lp-cta-h2 em { font-style: italic; color: var(--em-lt); }

        .lp-cta-p {
          font-size: 15px; color: rgba(255,255,255,0.55);
          max-width: 440px; margin: 0 auto 36px;
          line-height: 1.75;
        }

        .lp-cta-btns { display: flex; gap: 12px; justify-content: center; }

        .lp-cta-btn-white {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 14px;
          background: #fff; color: var(--ink);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 600;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .lp-cta-btn-white:hover { background: var(--sand); transform: translateY(-2px); }
        .lp-cta-btn-white svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; }

        .lp-cta-btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 14px;
          background: transparent; color: rgba(255,255,255,0.7);
          border: 1.5px solid rgba(255,255,255,0.18);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 500;
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
        }
        .lp-cta-btn-outline:hover { border-color: rgba(255,255,255,0.4); color: #fff; }

        /* ── FOOTER ── */
        .lp-footer {
          padding: 32px 32px;
          border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
        }
        .lp-footer-copy { font-size: 12.5px; color: var(--muted); }
        .lp-footer-links { display: flex; gap: 20px; }
        .lp-footer-links a {
          font-size: 12.5px; color: var(--muted); text-decoration: none;
          transition: color 0.2s;
        }
        .lp-footer-links a:hover { color: var(--ink); }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .lp-nav { padding: 0 20px; }
          .lp-feat-grid { grid-template-columns: 1fr; }
          .lp-dash { grid-template-columns: 1fr; }
          .lp-dash-sidebar { display: none; }
          .lp-dash-stats { grid-template-columns: repeat(2, 1fr); }
          .lp-cta-strip { padding: 48px 28px; margin: 0 16px 80px; }
          .lp-cta-btns { flex-direction: column; align-items: center; }
          .lp-hero-btns { flex-direction: column; align-items: center; }
          .lp-proof { flex-direction: column; gap: 10px; }
          .lp-proof-divider { display: none; }
        }
      `}</style>

      <div className="lp-body">

        {/* NAV */}
        <nav className="lp-nav">
          <a href="/" className="lp-logo">
            <div className="lp-logo-mark">
              <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="lp-logo-text">GrowCliento</span>
          </a>
          <div className="lp-nav-actions">
            <Link href="/login" className="lp-btn-ghost">Sign in</Link>
            <Link href="/register" className="lp-btn-solid">Get started →</Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-grid" />
          <div className="lp-glow" />

          <div className="lp-hero-inner">
            <div className="lp-badge">
              <div className="lp-badge-dot" />
              Built for Indian real estate brokers
            </div>

            <h1 className="lp-h1">
              Close more deals.<br />
              <em>Lose fewer leads.</em>
            </h1>

            <p className="lp-sub">
              GrowCliento ingests your WhatsApp group listings automatically, deduplicates properties, and gives every broker in your firm a shared CRM — without the chaos.
            </p>

            <div className="lp-hero-btns">
              <Link href="/register" className="lp-cta-primary">
                Start free trial
                <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <Link href="/login" className="lp-cta-secondary">
                Sign in to dashboard
              </Link>
            </div>

            <div className="lp-proof">
              <div className="lp-proof-item">
                <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                WhatsApp auto-ingestion
              </div>
              <div className="lp-proof-divider" />
              <div className="lp-proof-item">
                <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Property deduplication
              </div>
              <div className="lp-proof-divider" />
              <div className="lp-proof-item">
                <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Client share portal
              </div>
              <div className="lp-proof-divider" />
              <div className="lp-proof-item">
                <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Deal pipeline tracking
              </div>
            </div>
          </div>
        </section>

        {/* DASHBOARD PREVIEW */}
        <div className="lp-preview">
          <div className="lp-preview-frame">
            <div className="lp-preview-bar">
              <div className="lp-dots">
                <span /><span /><span />
              </div>
              <div className="lp-url">app.growcliento.com/v2/properties</div>
            </div>
            <div className="lp-dash">
              <div className="lp-dash-sidebar">
                <div className="lp-dash-logo">GrowCliento</div>
                {[
                  { icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', label: 'Dashboard', active: false },
                  { icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', label: 'Properties', active: true },
                  { icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Clients', active: false },
                  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Deals', active: false },
                  { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Team', active: false },
                ].map((item, i) => (
                  <div key={i} className={`lp-dash-item${item.active ? ' active' : ''}`}>
                    <svg viewBox="0 0 24 24"><path d={item.icon}/></svg>
                    {item.label}
                  </div>
                ))}
              </div>

              <div className="lp-dash-main">
                <div className="lp-dash-topbar">
                  <div className="lp-dash-title">Properties — Delhi NCR</div>
                  <div className="lp-dash-pill">247 listings synced</div>
                </div>

                <div className="lp-dash-stats">
                  {[
                    { num: '247', label: 'Total listings', up: '+12 today' },
                    { num: '38', label: 'Active leads', up: '+4 this week' },
                    { num: '6', label: 'Deals in pipeline', up: '2 closing soon' },
                    { num: '94%', label: 'Dedup rate', up: 'AI-powered' },
                  ].map((s, i) => (
                    <div key={i} className="lp-stat">
                      <div className="lp-stat-num">{s.num}</div>
                      <div className="lp-stat-label">{s.label}</div>
                      <div className="lp-stat-up">{s.up}</div>
                    </div>
                  ))}
                </div>

                <div className="lp-dash-listings">
                  {[
                    { emoji: '🏢', title: '3 BHK Apartment — Sector 62, Noida', sub: 'Via WhatsApp · Sharma Realty', price: '₹85L', badge: 'new', badgeLabel: 'New' },
                    { emoji: '🏡', title: '4 BHK Villa — DLF Phase 4, Gurugram', sub: 'Via WhatsApp · Mehta Associates', price: '₹2.4Cr', badge: 'hot', badgeLabel: 'Hot' },
                    { emoji: '🏪', title: 'Commercial Shop — Vaishali, Ghaziabad', sub: 'Manual entry · Direct listing', price: '₹45L', badge: 'pending', badgeLabel: 'Review' },
                  ].map((l, i) => (
                    <div key={i} className="lp-listing">
                      <div className="lp-listing-thumb">{l.emoji}</div>
                      <div className="lp-listing-info">
                        <div className="lp-listing-title">{l.title}</div>
                        <div className="lp-listing-sub">{l.sub}</div>
                      </div>
                      <div className="lp-listing-price">{l.price}</div>
                      <div className={`lp-listing-badge lp-badge-${l.badge}`}>{l.badgeLabel}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <div className="lp-features">
          <div className="lp-section-label">Features</div>
          <h2 className="lp-section-title">
            Everything a broker firm needs.<br />Nothing they don't.
          </h2>
          <p className="lp-section-sub">
            Built specifically for how Indian real estate brokers actually work — WhatsApp groups, shared listings, competitive clients.
          </p>

          <div className="lp-feat-grid">
            {[
              {
                icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
                name: 'WhatsApp Auto-Ingestion',
                desc: 'Connect your WhatsApp groups. GrowCliento reads every listing message and adds it to your CRM automatically — no manual entry.',
              },
              {
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                name: 'AI Property Deduplication',
                desc: 'Same property listed by 5 brokers? Our AI fingerprints each property and merges duplicates into a single canonical record.',
              },
              {
                icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
                name: 'Client Share Portal',
                desc: 'Send clients a beautiful property selection page. They browse, mark interest, and you get notified — all without WhatsApp chaos.',
              },
              {
                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                name: 'Deal Pipeline',
                desc: 'Track every deal from initiated to completed. Multi-firm commission chains, deal status, and a full activity timeline.',
              },
              {
                icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
                name: 'Property Media',
                desc: 'Attach photos and videos to listings. Broker-uploaded or WhatsApp-ingested. Stored on R2 with smart quota tracking.',
              },
              {
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
                name: 'Multi-Broker Workspace',
                desc: 'Add your whole team. Role-based access, shared listings, individual lead ownership — built for how firms actually operate.',
              },
            ].map((f, i) => (
              <div key={i} className="lp-feat-card">
                <div className="lp-feat-icon">
                  <svg viewBox="0 0 24 24"><path d={f.icon}/></svg>
                </div>
                <div className="lp-feat-name">{f.name}</div>
                <div className="lp-feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '0 24px 100px', maxWidth: 1100, margin: '0 auto' }}>
          <div className="lp-cta-strip">
            <div className="lp-cta-orb lp-cta-orb-1" />
            <div className="lp-cta-orb lp-cta-orb-2" />
            <div className="lp-cta-inner">
              <h2 className="lp-cta-h2">
                Your next deal is<br />
                <em>already in your WhatsApp.</em>
              </h2>
              <p className="lp-cta-p">
                Stop losing listings in group chats. Connect GrowCliento and let the CRM build itself.
              </p>
              <div className="lp-cta-btns">
                <Link href="/register" className="lp-cta-btn-white">
                  Start free trial
                  <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
                <Link href="/login" className="lp-cta-btn-outline">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="lp-footer-copy">
            © 2026 GrowCliento · Built for Indian real estate brokers
          </div>
          <div className="lp-footer-links">
            <Link href="/login">Sign in</Link>
            <Link href="/register">Register</Link>
          </div>
        </footer>

      </div>
    </>
  );
}