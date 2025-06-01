import React, { useEffect, useState } from "react";
import axios from "axios";
import { updateCollection } from "../firebase/collections";
import { getLikesForCollection, getCommentsForCollection, addLikeToCollection, removeLikeFromCollection, addCommentToCollection } from "../firebase/collectionInteractions";
import { getCommentsForPost } from "../firebase/apodPostsInteractions";
import { getUserByUid } from "../firebase/users";

const NASA_API_KEY = "F0y2EDV7Zo3jIKnnzxaN4PYb8FK4Lnp6rhOQ1d5Q";

const visibilityOptions = [
  { value: "public", label: "Herkese Açık" },
  { value: "followers", label: "Sadece Takipçiler" },
  { value: "private", label: "Gizli" },
];

const CollectionDetailModal = ({ open, onClose, collection, imagesMap: initialImagesMap, onCollectionUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(collection?.name || "");
  const [visibility, setVisibility] = useState(collection?.privacy || "public");
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageComments, setImageComments] = useState([]);
  const [imagesMap, setImagesMap] = useState(initialImagesMap);
  const [likeUsers, setLikeUsers] = useState([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [collectionComments, setCollectionComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentUsers, setCommentUsers] = useState({});
  const [commentLoading, setCommentLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!collection) return;
    setName(collection.name);
    setVisibility(collection.privacy || "public");
    getLikesForCollection(collection.id).then(likes => setLikes(likes.length));
    getCommentsForCollection(collection.id).then(comments => setComments(comments.length));
  }, [collection]);

  useEffect(() => {
    // Koleksiyondaki eksik görselleri NASA API'dan çek
    const fetchMissingImages = async () => {
      if (!collection || !Array.isArray(collection.items)) return;
      const missingDates = collection.items
        .map(item => item.postId)
        .filter(date => !imagesMap[date]);
      if (missingDates.length === 0) return;
      const fetches = missingDates.map(date =>
        axios.get(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${date}`)
          .then(res => ({ date, data: res.data }))
          .catch(() => null)
      );
      const results = await Promise.all(fetches);
      const newImages = {};
      results.forEach(res => {
        if (res && res.data) newImages[res.date] = res.data;
      });
      setImagesMap(prev => ({ ...prev, ...newImages }));
    };
    fetchMissingImages();
    // eslint-disable-next-line
  }, [collection, imagesMap]);

  useEffect(() => {
    if (!collection) return;
    let mounted = true;
    const fetchData = async () => {
      const likes = await getLikesForCollection(collection.id);
      const comments = await getCommentsForCollection(collection.id);
      if (mounted) {
        setLikeUsers(likes);
        setLiked(likes.some(l => l.userId === window?.currentUser?.uid));
        setLikeCount(likes.length);
        setCollectionComments(comments);
        // Yorum yapan kullanıcıların adlarını çek
        const userIds = Array.from(new Set(comments.map(c => c.userId)));
        const userMap = {};
        await Promise.all(userIds.map(async (uid) => {
          const user = await getUserByUid(uid);
          userMap[uid] = user ? (user.username || user.displayName || user.uid) : uid;
        }));
        setCommentUsers(userMap);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => { mounted = false; clearInterval(interval); };
  }, [collection]);

  const handleSave = async () => {
    await updateCollection(collection.id, { name, privacy: visibility });
    setEditMode(false);
    if (onCollectionUpdate) onCollectionUpdate();
  };

  const handleImageClick = async (img) => {
    setSelectedImage(img);
    const comments = await getCommentsForPost(img.date);
    setImageComments(comments);
  };

  if (!open || !collection) return null;
  const items = Array.isArray(collection.items) ? collection.items : [];
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#23294a', borderRadius: 16, padding: 32, maxWidth: 800, width: '100%', position: 'relative', color: '#fff', minHeight: 400 }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, color: '#fff', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✖</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {editMode ? (
            <>
              <input value={name} onChange={e => setName(e.target.value)} style={{ fontSize: 22, fontWeight: 700, borderRadius: 6, padding: 4 }} />
              <select value={visibility} onChange={e => setVisibility(e.target.value)} style={{ fontSize: 16, borderRadius: 6, padding: 4 }}>
                {visibilityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <button onClick={handleSave} style={{ marginLeft: 8 }}>Kaydet</button>
              <button onClick={() => setEditMode(false)} style={{ marginLeft: 4 }}>İptal</button>
            </>
          ) : (
            <>
              <h2 style={{ color: '#ffe082', margin: 0 }}>{collection.name}</h2>
              <span style={{ color: '#b0bec5', fontSize: 15, marginLeft: 8 }}>({visibilityOptions.find(v => v.value === (collection.privacy || 'public')).label})</span>
              {window.currentUser && window.currentUser.uid === collection.ownerId && (
                <button onClick={() => setEditMode(true)} style={{ marginLeft: 12, background: 'none', border: '1px solid #ffe082', color: '#ffe082', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>Ayarlar</button>
              )}
              <div style={{ color: '#90caf9', fontSize: 15, marginTop: 4 }}>
                {Array.isArray(collection.items) ? collection.items.length : 0} görsel
              </div>
            </>
          )}
        </div>
        <div style={{ color: '#90caf9', marginTop: 4, fontSize: 15 }}>
          <button onClick={async () => {
            if (!window?.currentUser) return;
            if (liked) {
              await removeLikeFromCollection(collection.id, window.currentUser.uid);
            } else {
              try {
                await addLikeToCollection(collection.id, window.currentUser.uid);
                setMessage("Beğeni eklendi!");
              } catch (e) {
                setMessage("Beğeni eklenemedi: " + e.message);
              }
            }
          }}
            style={{ background: 'none', border: 'none', color: liked ? '#e53935' : '#ffe082', fontSize: 22, cursor: 'pointer', marginRight: 8 }}>
            {liked ? '❤️' : '🤍'}
          </button>
          <b>{likeCount}</b> beğeni &nbsp;|&nbsp; <b>{collectionComments.length}</b> yorum
        </div>
        <div style={{ marginTop: 24, overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 16 }}>
          {items.length > 0 ? (
            items.map(item => {
              const img = imagesMap[item.postId];
              if (!img) {
                return (
                  <div key={item.postId} style={{ display: 'inline-block', width: 220, marginRight: 16, verticalAlign: 'top', background: '#181c2b', borderRadius: 10, boxShadow: '0 2px 8px #0004', cursor: 'not-allowed', opacity: 0.5, textAlign: 'center', padding: 16 }}>
                    <div style={{ color: '#ffe082', fontWeight: 600, fontSize: 16 }}>Görsel yükleniyor...</div>
                    <div style={{ color: '#b0bec5', fontSize: 13, marginTop: 8 }}>postId: {item.postId}</div>
                  </div>
                );
              }
              return (
                <div key={item.postId} style={{ display: 'inline-block', width: 220, marginRight: 16, verticalAlign: 'top', background: '#181c2b', borderRadius: 10, boxShadow: '0 2px 8px #0004', cursor: 'pointer' }} onClick={() => handleImageClick(img)}>
                  {img.media_type === 'image' ? (
                    <img src={img.url} alt={img.title} style={{ width: '100%', borderRadius: 10, height: 120, objectFit: 'cover' }} />
                  ) : (
                    <video style={{ width: '100%', borderRadius: 10, height: 120, objectFit: 'cover' }}>
                      <source src={img.url} type="video/mp4" />
                    </video>
                  )}
                  <div style={{ padding: 8 }}>
                    <div style={{ color: '#ffe082', fontWeight: 600 }}>{img.title}</div>
                    <div style={{ color: '#b0bec5', fontSize: 13 }}>{img.date}</div>
                    <div style={{ color: '#90caf9', fontSize: 12, marginTop: 4 }}>postId: {item.postId}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ color: '#90caf9' }}>Koleksiyonda görsel yok.</div>
          )}
        </div>
        {/* Seçili görselin detayları ve yorumları */}
        {selectedImage && (
          <div style={{ marginTop: 24, background: '#181c2b', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              {selectedImage.media_type === 'image' ? (
                <img src={selectedImage.url} alt={selectedImage.title} style={{ width: 180, borderRadius: 10 }} />
              ) : (
                <video controls style={{ width: 180, borderRadius: 10 }}>
                  <source src={selectedImage.url} type="video/mp4" />
                </video>
              )}
              <div>
                <div style={{ color: '#ffe082', fontWeight: 600, fontSize: 20 }}>{selectedImage.title}</div>
                <div style={{ color: '#b0bec5', fontSize: 14 }}>{selectedImage.date}</div>
                <div style={{ color: '#b0bec5', fontSize: 14, marginTop: 8 }}>{selectedImage.explanation}</div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <h4 style={{ color: '#ffe082' }}>Yorumlar</h4>
              <div style={{ maxHeight: 120, overflowY: 'auto', background: '#23294a', borderRadius: 6, padding: 8 }}>
                {imageComments.length === 0 && <div style={{ color: '#90caf9' }}>Henüz yorum yok.</div>}
                {imageComments.map(c => (
                  <div key={c.id} style={{ borderBottom: '1px solid #3949ab', padding: 4, color: '#fff' }}>
                    <b>{c.userId}</b>: {c.comment}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Koleksiyonun genel yorumları */}
        <div style={{ marginTop: 24, background: '#181c2b', borderRadius: 10, padding: 16 }}>
          <h4 style={{ color: '#ffe082' }}>Koleksiyon Yorumları</h4>
          <form
            onSubmit={async e => {
              e.preventDefault();
              if (!window?.currentUser || !commentText.trim()) return;
              setCommentLoading(true);
              await addCommentToCollection(collection.id, window.currentUser.uid, commentText.trim());
              setCommentText("");
              setCommentLoading(false);
            }}
            style={{ display: 'flex', gap: 8, marginBottom: 8 }}
          >
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Yorum ekle..."
              style={{ flex: 1, borderRadius: 6, border: '1px solid #3949ab', padding: 8, background: '#23294a', color: '#fff' }}
              disabled={commentLoading}
            />
            <button
              type="submit"
              disabled={commentLoading || !commentText.trim()}
              style={{ background: '#ffe082', color: '#181c2b', border: 'none', borderRadius: 6, padding: '0 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              {commentLoading ? '...' : 'Ekle'}
            </button>
          </form>
          <div style={{ maxHeight: 140, overflowY: 'auto', background: '#23294a', borderRadius: 6, padding: 8 }}>
            {collectionComments.length === 0 && <div style={{ color: '#90caf9' }}>Henüz yorum yok.</div>}
            {[...collectionComments]
              .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
              .map(c => (
                <div key={c.id} style={{ borderBottom: '1px solid #3949ab', padding: 4, color: '#fff' }}>
                  <b>{commentUsers[c.userId] || c.userId}</b>: {c.comment}
                </div>
              ))}
          </div>
        </div>
        {message && <div style={{ color: message.includes("eklendi") ? "green" : "red" }}>{message}</div>}
      </div>
    </div>
  );
};

export default CollectionDetailModal; 