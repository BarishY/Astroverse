import React, { useEffect, useState } from "react";
import { getPublicCollections, getPopularCollections } from "../firebase/collections";
import CollectionDetailModal from '../components/CollectionDetailModal';

const Explore = () => {
  const [tab, setTab] = useState("latest");
  const [latest, setLatest] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPublicCollections().then(data => {
      setLatest(data);
      setLoading(false);
    });
    getPopularCollections().then(setPopular);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#181c2b", padding: 32 }}>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 32 }}>
        <button
          style={{
            background: tab === "latest" ? "#ffe082" : "#23294a",
            color: tab === "latest" ? "#181c2b" : "#ffe082",
            border: "none",
            borderRadius: 8,
            padding: "8px 24px",
            fontWeight: 700,
            fontSize: 18,
            cursor: "pointer"
          }}
          onClick={() => setTab("latest")}
        >
          Son Koleksiyonlar
        </button>
        <button
          style={{
            background: tab === "popular" ? "#ffe082" : "#23294a",
            color: tab === "popular" ? "#181c2b" : "#ffe082",
            border: "none",
            borderRadius: 8,
            padding: "8px 24px",
            fontWeight: 700,
            fontSize: 18,
            cursor: "pointer"
          }}
          onClick={() => setTab("popular")}
        >
          Popüler Koleksiyonlar
        </button>
      </div>
      <div>
        {loading ? (
          <div style={{ color: "#90caf9", textAlign: "center", marginTop: 40 }}>Yükleniyor...</div>
        ) : tab === "latest" ? (
          <CollectionGrid collections={latest} setSelectedCollection={setSelectedCollection} setModalOpen={setModalOpen} />
        ) : (
          <CollectionGrid collections={popular} setSelectedCollection={setSelectedCollection} setModalOpen={setModalOpen} />
        )}
      </div>
      <CollectionDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        collection={selectedCollection}
        imagesMap={{}}
        onCollectionUpdate={() => {}}
      />
    </div>
  );
};

const CollectionGrid = ({ collections, setSelectedCollection, setModalOpen }) => {
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, padding: 16 }}>
      {collections.map(collection => {
        const items = Array.isArray(collection.items) ? collection.items : [];
        const coverUrl = coverUrls[collection.id];
        const createdAt = collection.createdAt ? (collection.createdAt.seconds ? new Date(collection.createdAt.seconds * 1000) : new Date(collection.createdAt)) : null;
        return (
          <div key={collection.id} style={{ background: '#181c2b', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px #0004', border: '1px solid #3949ab', cursor: 'pointer' }}
            onClick={() => { setSelectedCollection(collection); setModalOpen(true); }}>
            {coverUrl ? (
              <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', height: 120 }}>
                <img src={coverUrl} alt="Kapak" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', height: 120, background: '#23294a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 32 }}>🪐</span>
              </div>
            )}
            <div style={{ fontWeight: 600, fontSize: 18, color: '#ffe082' }}>
              {(collection.ownerUsername || collection.owner || '') + ' ' + collection.name}
            </div>
            <div style={{ color: '#b0bec5', fontSize: 13, marginTop: 8 }}>Görsel sayısı: {items.length}</div>
            <div style={{ color: '#b0bec5', fontSize: 13, marginTop: 4 }}>Gizlilik: {collection.privacy || 'public'}</div>
            <div style={{ color: '#b0bec5', fontSize: 13, marginTop: 4 }}>
              Oluşturulma: {createdAt ? createdAt.toLocaleDateString('tr-TR') : '-'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Explore; 