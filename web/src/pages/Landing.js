import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) navigate('/profile');
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#181c2b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#23294a', borderRadius: 16, padding: 48, boxShadow: '0 4px 24px #0006', textAlign: 'center' }}>
        <div style={{ fontSize: 48, color: '#ffe082', fontWeight: 700, marginBottom: 16 }}>AstroSpace</div>
        <div style={{ color: '#b0bec5', fontSize: 20, marginBottom: 32 }}>Uzayın derinliklerinde keşfe çık!</div>
        <button onClick={() => navigate('/login')} style={{ background: '#ffe082', color: '#23294a', border: 'none', borderRadius: 8, padding: '12px 32px', fontWeight: 700, fontSize: 18, cursor: 'pointer', marginRight: 16 }}>Giriş Yap</button>
        <button onClick={() => navigate('/register')} style={{ background: 'none', border: '1px solid #ffe082', color: '#ffe082', borderRadius: 8, padding: '12px 32px', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>Kayıt Ol</button>
      </div>
    </div>
  );
};

export default Landing; 