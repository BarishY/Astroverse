import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#181c2b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#23294a', borderRadius: 16, padding: 40, boxShadow: '0 4px 24px #0006', textAlign: 'center', width: 340 }}>
        <h2 style={{ color: '#ffe082', marginBottom: 24 }}>Giriş Yap</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', marginBottom: 16, padding: 10, borderRadius: 6, border: '1px solid #3949ab', background: '#23294a', color: '#fff' }} />
          <input type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', marginBottom: 16, padding: 10, borderRadius: 6, border: '1px solid #3949ab', background: '#23294a', color: '#fff' }} />
          {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
          <button type="submit" style={{ width: '100%', background: '#ffe082', color: '#23294a', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 17, cursor: 'pointer', marginBottom: 8 }}>Giriş Yap</button>
        </form>
        <div style={{ color: '#b0bec5', marginTop: 12 }}>
          Hesabın yok mu? <Link to="/register" style={{ color: '#ffe082', textDecoration: 'underline' }}>Kayıt Ol</Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 