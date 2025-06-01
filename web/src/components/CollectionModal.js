import React, { useEffect, useState } from "react";
import { getUserCollections, addCollection, updateCollection } from "../firebase/collections";

const CollectionModal = ({ open, onClose, user, image, onSave }) => {
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      getUserCollections(user.uid).then(setCollections);
    }
  }, [user, open]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const id = await addCollection(user.uid, newCollectionName.trim());
      setCollections([...collections, { id, name: newCollectionName.trim(), userId: user.uid }]);
      setNewCollectionName("");
    } catch (e) {
      setError("Koleksiyon oluşturulamadı.");
    }
    setLoading(false);
  };

  const handleSaveToCollection = async (col) => {
    // Koleksiyonun içeriğinde bu görsel zaten var mı kontrolü
    if (col.items && col.items.includes(image.date)) {
      setError("Bu görsel zaten bu koleksiyonda var.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const items = col.items ? [...col.items, image.date] : [image.date];
      await updateCollection(col.id, { items });
      if (onSave) onSave(col.id);
      onClose();
    } catch (e) {
      setError("Kaydetme işlemi başarısız.");
    }
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 400, width: '100%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8 }}>Kapat</button>
        <h3>Koleksiyona Kaydet</h3>
        <div>
          <input
            type="text"
            placeholder="Yeni koleksiyon adı"
            value={newCollectionName}
            onChange={e => setNewCollectionName(e.target.value)}
            disabled={loading}
            style={{ width: '70%' }}
          />
          <button onClick={handleCreateCollection} disabled={loading || !newCollectionName.trim()}>Oluştur</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <b>Mevcut Koleksiyonlar</b>
          <ul style={{ maxHeight: 200, overflowY: 'auto', padding: 0, listStyle: 'none' }}>
            {collections.length === 0 && <li>Henüz koleksiyon yok.</li>}
            {collections.map(col => (
              <li key={col.id} style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{col.name}</span>
                <button onClick={() => handleSaveToCollection(col)} disabled={loading}>Kaydet</button>
              </li>
            ))}
          </ul>
        </div>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </div>
    </div>
  );
};

export default CollectionModal; 