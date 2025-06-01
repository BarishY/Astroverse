import React from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Ana Sayfa" },
  { to: "/messages", label: "Mesajlar" },
  { to: "/explore", label: "Keşfet" },
  { to: "/profile", label: "Profil" },
];

const Navbar = () => {
  const location = useLocation();
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: 64,
        background: 'linear-gradient(90deg, #181c2b 60%, #23294a 100%)',
        borderBottom: '2px solid #3949ab',
        boxShadow: '0 2px 12px #0006',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo/isim */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 32, marginRight: 8 }}>🪐</span>
        <span style={{ fontWeight: 800, fontSize: 22, color: '#ffe082', letterSpacing: 1 }}>AstroNova</span>
      </div>
      {/* Linkler */}
      <div style={{ display: 'flex', gap: 32 }}>
        {navItems.map(item => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              color: location.pathname === item.to ? '#ffe082' : '#b0bec5',
              fontWeight: location.pathname === item.to ? 700 : 500,
              fontSize: 18,
              textDecoration: 'none',
              padding: '8px 0',
              borderBottom: location.pathname === item.to ? '3px solid #ffe082' : '3px solid transparent',
              transition: 'color 0.2s, border-bottom 0.2s',
              position: 'relative',
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#ffe082')}
            onMouseOut={e => (e.currentTarget.style.color = location.pathname === item.to ? '#ffe082' : '#b0bec5')}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {/* Kullanıcı avatarı */}
      <div style={{ fontSize: 28, background: '#23294a', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px #3949ab88' }}>
        🪐
      </div>
    </nav>
  );
};

export default Navbar; 