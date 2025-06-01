import React, { useEffect, useState, useCallback } from "react";
import { getUserCollections } from "../firebase/collections";
import { fetchNasaImages } from "../api/nasa";
import CollectionDetailModal from "../components/CollectionDetailModal";
import { auth } from "../firebase/config";
import { getUserByUid, getUserFollowers, getUserFollowing } from "../firebase/users";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
// Takipçi ve takip edilen için placeholder fonksiyonlar

const Profile = () => {
  const [user, setUser] = useState(null);
  const [collections, setCollections] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [images, setImages] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [coverUrls, setCoverUrls] = useState({});
  const navigate = useNavigate();

  const fetchCollections = useCallback((uid) => {
    getUserCollections(uid).then(setCollections);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserByUid(firebaseUser.uid);
        setUser(userData);
        fetchCollections(firebaseUser.uid);
        getUserFollowers(firebaseUser.uid).then(f => setFollowers(f.length));
        getUserFollowing(firebaseUser.uid).then(f => setFollowing(f.length));
      } else {
        setUser(null);
        setCollections([]);
      }
    });
    fetchNasaImages().then(setImages);
    return () => unsubscribe();
  }, [fetchCollections]);

  useEffect(() => {
    const fetchCovers = async () => {
      const newCovers = {};
      for (const col of collections) {
        const items = Array.isArray(col.items) ? col.items : [];
        const lastItem = items.length > 0 ? items[items.length - 1] : null;
        if (lastItem) {
          try {
            const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=F0y2EDV7Zo3jIKnnzxaN4PYb8FK4Lnp6rhOQ1d5Q&date=${lastItem.postId}`);
            const data = await res.json();
            if (data.media_type === 'image') {
              newCovers[col.id] = data.url;
            } else {
              newCovers[col.id] = null;
            }
          } catch {
            newCovers[col.id] = null;
          }
        } else {
          newCovers[col.id] = null;
        }
      }
      setCoverUrls(newCovers);
    };
    if (collections.length > 0) fetchCovers();
  }, [collections]);

  // imagesMap: { [date]: imageObj }
  const imagesMap = images.reduce((acc, img) => {
    acc[img.date] = img;
    return acc;
  }, {});

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      alert("Çıkış yapılamadı: " + error.message);
    }
  };

  if (!user) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>Giriş yapmış bir kullanıcı bulunamadı.</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#181c2b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 48 }}>
      <div style={{ width: '100%', maxWidth: 600, background: '#23294a', color: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0006', padding: 32, marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <button onClick={handleSignOut} style={{ position: 'absolute', top: 24, right: 32, background: '#ffe082', color: '#23294a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px #0002', transition: 'background 0.2s' }}>
          Çıkış Yap
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center', width: '100%' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #ffe082 60%, #ff9800 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 'bold', boxShadow: '0 0 24px #ffe08288' }}>
            <span role="img" aria-label="user">🪐</span>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{user.displayName || user.username || user.uid}</div>
            <div style={{ color: '#90caf9', fontSize: 16 }}>@{user.username || user.uid}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32, marginTop: 24, justifyContent: 'center', width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Koleksiyon</div>
            <div style={{ fontSize: 22 }}>{collections.length}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Takip</div>
            <div style={{ fontSize: 22 }}>{following}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Takipçi</div>
            <div style={{ fontSize: 22 }}>{followers}</div>
          </div>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 600, background: '#23294a', borderRadius: 16, boxShadow: '0 4px 24px #0006', padding: 32, color: '#fff' }}>
        <h2 style={{ color: '#ffe082', borderBottom: '1px solid #333', paddingBottom: 8, textAlign: 'center' }}>Koleksiyonlarım</h2>
        {collections.length === 0 && <div style={{ color: '#90caf9', marginTop: 16, textAlign: 'center' }}>Henüz koleksiyonun yok. Uzayın derinliklerinde yeni koleksiyonlar oluştur!</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16, justifyContent: 'center' }}>
          {collections.map(col => {
            const items = Array.isArray(col.items) ? col.items : [];
            const coverUrl = coverUrls[col.id];
            const createdAt = col.createdAt ? (col.createdAt.seconds ? new Date(col.createdAt.seconds * 1000) : new Date(col.createdAt)) : null;
            return (
              <div key={col.id} style={{ background: '#181c2b', borderRadius: 12, padding: 16, minWidth: 180, boxShadow: '0 2px 8px #0004', border: '1px solid #3949ab', cursor: 'pointer' }}
                onClick={() => { setSelectedCollection(col); setModalOpen(true); }}>
                {coverUrl ? (
                  <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', height: 100 }}>
                    <img src={coverUrl} alt="Kapak" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', height: 100, background: '#23294a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 24 }}>🪐</span>
                  </div>
                )}
                <div style={{ fontWeight: 600, fontSize: 18, color: '#ffe082' }}>
                  {(col.ownerUsername || col.owner || '') + ' ' + col.name}
                </div>
                <div style={{ color: '#b0bec5', fontSize: 13, marginTop: 8 }}>Görsel sayısı: {items.length}</div>
                <div style={{ color: '#b0bec5', fontSize: 13, marginTop: 4 }}>Gizlilik: {col.privacy || 'public'}</div>
                <div style={{ color: '#b0bec5', fontSize: 13, marginTop: 4 }}>
                  Oluşturulma: {createdAt ? createdAt.toLocaleDateString('tr-TR') : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <CollectionDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        collection={selectedCollection}
        imagesMap={imagesMap}
        onCollectionUpdate={() => user && fetchCollections(user.uid)}
      />
    </div>
  );
};

export default Profile; 