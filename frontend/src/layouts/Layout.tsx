import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, MessageSquare, Camera, Book, Cpu, FlaskConical,
  Globe, Menu, X, Sprout, Bell, ChevronRight
} from 'lucide-react';

/* ── SVG Logo Mark ── */
const AgriLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Leaf shape */}
    <path d="M20 6 C20 6 8 10 8 22 C8 30 14 34 20 34 C26 34 32 30 32 22 C32 10 20 6 20 6Z"
      fill="url(#leafGrad)" opacity="0.9"/>
    {/* Central vein */}
    <path d="M20 8 L20 32" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Side veins */}
    <path d="M20 16 L13 22" stroke="#C9A84C" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
    <path d="M20 16 L27 22" stroke="#C9A84C" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
    <path d="M20 22 L14 27" stroke="#C9A84C" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    <path d="M20 22 L26 27" stroke="#C9A84C" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    {/* Gold dot at top */}
    <circle cx="20" cy="6" r="2.5" fill="#C9A84C"/>
    <defs>
      <linearGradient id="leafGrad" x1="8" y1="6" x2="32" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2A8C4A"/>
        <stop offset="1" stopColor="#0D5C35"/>
      </linearGradient>
    </defs>
  </svg>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [lang, setLang] = useState(() => localStorage.getItem('agrimind_lang') || 'en');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'AI Agricultural Assistant', href: '/chat', icon: MessageSquare },
    { name: 'Crop Health', href: '/crop-health', icon: Camera, matchPrefix: ['/crop-health', '/disease'] },
    { name: 'How AgriMind Works', href: '/how-it-works', icon: Cpu },
  ];

  const checkActive = (item: typeof navigation[0]) => {
    if ((item as any).matchPrefix) {
      return (item as any).matchPrefix.some((p: string) =>
        location.pathname === p || location.pathname.startsWith(`${p}/`)
      );
    }
    return location.pathname === item.href;
  };

  React.useEffect(() => {
    const handleLangSync = (e: any) => {
      const syncLang = e.detail || localStorage.getItem('agrimind_lang') || 'en';
      setLang(syncLang);
    };
    window.addEventListener('agrimind_lang_change', handleLangSync);
    window.addEventListener('storage', handleLangSync);
    return () => {
      window.removeEventListener('agrimind_lang_change', handleLangSync);
      window.removeEventListener('storage', handleLangSync);
    };
  }, []);

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'ta' : 'en';
    setLang(next);
    localStorage.setItem('agrimind_lang', next);
    window.dispatchEvent(new CustomEvent('agrimind_lang_change', { detail: next }));
    window.dispatchEvent(new Event('storage'));
  };

  const currentPage = navigation.find((item) => checkActive(item))?.name || 'AgriMind';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5FFF7', fontFamily: "'Inter', sans-serif" }}>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(10,31,15,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`agri-sidebar fixed md:static inset-y-0 left-0 z-50 flex flex-col flex-shrink-0 transition-transform duration-250 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ width: '268px' }}
        aria-label="Sidebar Navigation"
      >
        {/* Brand */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
          <Link
            to="/"
            className="flex items-center gap-3 focus:outline-none"
            onClick={() => setMobileOpen(false)}
            style={{ textDecoration: 'none' }}
          >
            <div className="agri-logo-box gold-pulse">
              <AgriLogo size={26} />
            </div>
            <div>
              <div className="agri-brand-name">AgriMind</div>
              <div className="agri-brand-sub">Multimodal AI Platform</div>
            </div>
          </Link>

          {/* Mobile close */}
          <button
            className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg"
            style={{ color: 'rgba(168,239,196,0.7)', background: 'rgba(255,255,255,0.05)' }}
            onClick={() => setMobileOpen(false)}
          >
            <X size={18}/>
          </button>
        </div>

        {/* Status pill */}
        <div style={{ padding: '10px 18px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(42,140,74,0.12)', border: '1px solid rgba(42,140,74,0.25)',
            borderRadius: 100, padding: '4px 12px',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#4DB870', display: 'inline-block',
              boxShadow: '0 0 6px #4DB870',
              animation: 'gold-pulse 2s ease-in-out infinite'
            }}/>
            <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#A8EFC4', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              TNAU / ICAR Grounded
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 10px', overflowY: 'auto' }} aria-label="Main Navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = checkActive(item);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '3px 0', textDecoration: 'none' }}
              >
                <Icon className="sidebar-icon" size={17} aria-hidden="true"/>
                <span style={{ flex: 1, lineHeight: 1.3 }}>{item.name}</span>
                {isActive && <ChevronRight size={14} style={{ color: 'rgba(201,168,76,0.6)' }}/>}
              </Link>
            );
          })}
        </nav>

        {/* SDG Badge */}
        <div className="agri-sdg-badge">
          <div className="agri-sdg-badge-title">
            <Sprout size={12}/>
            UN SDG 2 · Zero Hunger
          </div>
          <div className="agri-sdg-badge-text">
            Evidence-grounded AI for Indian agro-ecosystems. Built on TNAU &amp; ICAR research.
          </div>
        </div>

        {/* Version footer */}
        <div style={{
          padding: '10px 18px 14px',
          borderTop: '1px solid rgba(201,168,76,0.1)',
          fontSize: '0.65rem', fontWeight: 600,
          color: 'rgba(126,189,154,0.5)',
          letterSpacing: '0.06em'
        }}>
          AgriMind v1.0 · TNAU Lab Demo
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Bar */}
        <header className="agri-topbar h-16 flex items-center justify-between px-5 sm:px-7 flex-shrink-0" style={{ zIndex: 10 }}>
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              className="md:hidden p-2 rounded-xl"
              style={{ color: '#1A5C31', background: '#EDFFF3', border: '1.5px solid #C3E6CB' }}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={18}/>
            </button>

            <div>
              <h1 className="agri-topbar-title">{currentPage}</h1>
              <p style={{ fontSize: '0.68rem', color: '#2D6A4F', fontWeight: 600, margin: 0 }}>
                AgriMind Intelligence Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Lang toggle */}
            <button className="agri-lang-btn" onClick={toggleLanguage} aria-label="Toggle language">
              <Globe size={14} style={{ color: '#1A5C31' }}/>
              <span>{lang === 'en' ? 'English (EN)' : 'தமிழ் (TA)'}</span>
            </button>

            {/* Bell */}
            <div
              style={{
                position: 'relative', padding: 8, borderRadius: 10,
                border: '1.5px solid #C3E6CB', cursor: 'pointer',
                background: '#F5FFF7', color: '#1A5C31', transition: 'all 0.18s'
              }}
              title="System Status: Operational"
              role="status"
            >
              <Bell size={16}/>
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 7, height: 7, borderRadius: '50%',
                background: '#4DB870', boxShadow: '0 0 5px #4DB870'
              }}/>
            </div>

            {/* User */}
            <div className="flex items-center gap-2.5 pl-3" style={{ borderLeft: '1.5px solid #C3E6CB' }}>
              <div className="agri-avatar">G</div>
              <div className="hidden sm:block">
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0A1F0F', lineHeight: 1.2 }}>Guest Researcher</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#2A8C4A', lineHeight: 1.2 }}>TNAU Lab Demo</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#F5FFF7' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
