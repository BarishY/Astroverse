import React, { useEffect, useState } from "react";
import { fetchNasaImages } from "../api/nasa";
import ImageFeed from "../components/ImageFeed";
import ImageModal from "../components/ImageModal";
import { auth } from "../firebase/config";
import { getUserFollowing, getUserByUid } from "../firebase/users";
import { getUserCollections } from "../firebase/collections";

const Home = () => {
  const [tab, setTab] = useState("nasa");
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [personalCollections, setPersonalCollections] = useState([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [nasaImages, setNasaImages] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(firebaseUser => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (nasaImages.length === 0) {
      fetchNasaImages().then(imgs => setNasaImages(imgs.slice(0, 30)));
    }
  }, [nasaImages.length]);

  useEffect(() => {
    if (tab === "nasa") {
      setImages(nasaImages);
    }
    if (tab === "personal" && user) {
      setLoadingPersonal(true);
      getUserFollowing(user.uid).then(async (following) => {
        let allCollections = [];
        for (const uid of following) {
          const u = await getUserByUid(uid);
          if (!u) continue;
          const collections = await getUserCollections(uid);
          // Sadece herkese açık veya takipçilere özel koleksiyonlar
          const filtered = collections.filter(col => col.privacy === "public" || col.privacy === "followers");
          // Kullanıcı adı ekle
          filtered.forEach(col => {
            col.ownerUsername = u.username || u.displayName || u.uid;
            col.owner = u.uid;
          });
          allCollections = allCollections.concat(filtered);
        }
        setPersonalCollections(allCollections);
        setLoadingPersonal(false);
      });
    }
  }, [tab, user, nasaImages]);

  const handleImageClick = (img) => {
    setSelectedImage(img);
    setModalOpen(true);
  };

  // CollectionGrid benzeri grid
  const PersonalGrid = ({ collections }) => {
    const [coverUrls, setCoverUrls] = useState({});

    useEffect(() => {
      const fetchCovers = async () => {
        const newCovers = {};
        for (const collection of collections) {
          const items = Array.isArray(collection.items) ? collection.items : [];
          const lastItem = items.length > 0 ? items[items.length - 1] : null;
          if (lastItem) {
            try {
              const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=F0y2EDV7Zo3jIKnnzxaN4PYb8FK4Lnp6rhOQ1d5Q&date=${lastItem.postId}`);
              const data = await res.json();
              if (data.media_type === 'image') {
                newCovers[collection.id] = data.url;
              } else {
                newCovers[collection.id] = null;
              }
            } catch {
              newCovers[collection.id] = null;
            }
          } else {
            newCovers[collection.id] = null;
          }
        }
        setCoverUrls(newCovers);
      };
      fetchCovers();
    }, [collections]);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, padding: 16 }}>
        {collections.map(collection => {
          const items = Array.isArray(collection.items) ? collection.items : [];
          const coverUrl = coverUrls[collection.id];
          const createdAt = collection.createdAt ? (collection.createdAt.seconds ? new Date(collection.createdAt.seconds * 1000) : new Date(collection.createdAt)) : null;
          return (
            <div key={collection.id} style={{ background: '#181c2b', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px #0004', border: '1px solid #3949ab', cursor: 'pointer' }}>
              {coverUrl ? (
                <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', height: 120 }}>
                  <img src={coverUrl} alt="Kapak" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', height: 120, background: '#23294a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 32 }}>🪐</span>
                </div>
              )}
              <div style={{ fontWeight: 600, fontSize: 18, color: '#ffe082' }}>{(collection.ownerUsername || collection.owner || '') + ' ' + collection.name}</div>
              <div style={{ color: '#b0bec5', fontSize: 13, marginTop: 8 }}>Görsel sayısı: {items.length}</div>
              <div style={{ color: '#b0bec5', fontSize: 13, marginTop: 4 }}>Gizlilik: {collection.privacy || 'public'}</div>
              <div style={{ color: '#b0bec5', fontSize: 13, marginTop: 4 }}>Oluşturulma: {createdAt ? createdAt.toLocaleDateString('tr-TR') : '-'}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#181c2b', borderRadius: 16, boxShadow: '0 4px 24px #0006', padding: 24 }}>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32 }}>
        <button
          style={{
            background: tab === "nasa" ? "#ffe082" : "#23294a",
            color: tab === "nasa" ? "#181c2b" : "#ffe082",
            border: "none",
            borderRadius: 8,
            padding: "8px 24px",
            fontWeight: 700,
            fontSize: 18,
            cursor: "pointer"
          }}
          onClick={() => setTab("nasa")}
        >
          NASA
        </button>
        <button
          style={{
            background: tab === "personal" ? "#ffe082" : "#23294a",
            color: tab === "personal" ? "#181c2b" : "#ffe082",
            border: "none",
            borderRadius: 8,
            padding: "8px 24px",
            fontWeight: 700,
            fontSize: 18,
            cursor: "pointer"
          }}
          onClick={() => setTab("personal")}
        >
          Bana Özel
        </button>
      </div>
      {tab === "nasa" && (
        <>
          <ImageFeed images={images} onImageClick={handleImageClick} user={user} />
          <ImageModal open={modalOpen} onClose={() => setModalOpen(false)} image={selectedImage} user={user} showActions />
        </>
      )}
      {tab === "personal" && (
        loadingPersonal ? (
          <div style={{ color: '#90caf9', textAlign: 'center', marginTop: 40, fontSize: 20 }}>Yükleniyor...</div>
        ) : !user ? (
          <div style={{ color: '#90caf9', textAlign: 'center', marginTop: 40, fontSize: 20 }}>Giriş yapmalısınız.</div>
        ) : personalCollections.length === 0 ? (
          <div style={{ color: '#90caf9', textAlign: 'center', marginTop: 40, fontSize: 20 }}>Takip ettiklerinin herkese açık veya takipçilere özel koleksiyonu yok.</div>
        ) : (
          <PersonalGrid collections={personalCollections} />
        )
      )}
    </div>
  );
};

export default Home; 