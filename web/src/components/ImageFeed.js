import React, { useState } from "react";
import { getLikesForPost, addLikeToPost, getCommentsForPost, removeLikeFromPost } from "../firebase/apodPostsInteractions";
import ImageModal from "./ImageModal";
import CollectionModal from "./CollectionModal";
import { getUserFollowers, getUserFollowing, getUserByUid } from "../firebase/users";
import { addMessage } from "../firebase/messages";

const ShareModal = ({ open, onClose, user, image }) => {
  const [mutuals, setMutuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(null);

  React.useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    Promise.all([
      getUserFollowers(user.uid),
      getUserFollowing(user.uid)
    ]).then(([followers, following]) => {
      const mutualIds = followers.filter(f => following.includes(f));
      Promise.all(mutualIds.map(uid => getUserByUid(uid))).then(users => {
        setMutuals(users.filter(Boolean));
        setLoading(false);
      });
    });
  }, [open, user]);

  const handleSend = async (toUser) => {
    await addMessage(user.uid, toUser.uid, "", {
      type: "apod",
      apod: {
        title: image.title,
        url: image.url,
        date: image.date,
        explanation: image.explanation,
        media_type: image.media_type
      }
    });
    setSent(toUser.uid);
    setTimeout(() => { setSent(null); onClose(); }, 1200);
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#23294a', borderRadius: 12, padding: 32, minWidth: 320, color: '#fff', boxShadow: '0 4px 24px #0008', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#ffe082', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>Kapat</button>
        <h3 style={{ color: '#ffe082', marginBottom: 16 }}>Kime göndermek istiyorsun?</h3>
        {loading ? <div style={{ color: '#90caf9' }}>Yükleniyor...</div> : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 220, overflowY: 'auto' }}>
            {mutuals.length === 0 && <li style={{ color: '#90caf9' }}>Karşılıklı takip ettiğin kimse yok.</li>}
            {mutuals.map(u => (
              <li key={u.uid} style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>🪐</span>
                <span style={{ fontWeight: 600 }}>{u.displayName || u.username || u.uid}</span>
                <button onClick={() => handleSend(u)} disabled={sent === u.uid} style={{ marginLeft: 'auto', background: '#ffe082', color: '#181c2b', border: 'none', borderRadius: 8, padding: '4px 16px', fontWeight: 700, cursor: 'pointer' }}>{sent === u.uid ? 'Gönderildi!' : 'Gönder'}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const ImageFeed = ({ images, onImageClick, user }) => {
  const [likeStates, setLikeStates] = useState({}); // { [date]: { liked: bool, count: number } }
  const [commentCounts, setCommentCounts] = useState({}); // { [date]: number }
  const [commentModal, setCommentModal] = useState({ open: false, image: null });
  const [collectionModal, setCollectionModal] = useState({ open: false, image: null });
  const [shareModal, setShareModal] = useState({ open: false, image: null });

  // Beğeni ve yorum sayılarını yükle (ilk renderda veya yeni görsel geldiğinde)
  React.useEffect(() => {
    let mounted = true;
    const fetchCounts = () => {
      images.forEach(img => {
        getLikesForPost(img.date).then(likes => {
          if (!mounted) return;
          setLikeStates(prev => ({
            ...prev,
            [img.date]: {
              liked: user ? likes.some(l => l.userId === user.uid) : false,
              count: likes.length
            }
          }));
        });
        getCommentsForPost(img.date).then(comments => {
          if (!mounted) return;
          setCommentCounts(prev => ({ ...prev, [img.date]: comments.length }));
        });
      });
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 2000);
    return () => { mounted = false; clearInterval(interval); };
  }, [images, user]);

  const handleLike = async (img) => {
    if (!user) return;
    const current = likeStates[img.date]?.liked;
    if (current) {
      // Beğeniyi kaldır
      await removeLikeFromPost(img.date, user.uid);
    } else {
      // Beğeni ekle
      await addLikeToPost(img.date, user.uid);
    }
    const likes = await getLikesForPost(img.date);
    setLikeStates(prev => ({
      ...prev,
      [img.date]: {
        liked: !current,
        count: likes.length
      }
    }));
  };

  const handleComment = (img) => {
    setCommentModal({ open: true, image: img });
  };

  const handleSave = (img) => {
    setCollectionModal({ open: true, image: img });
  };

  const handleShare = (img) => {
    setShareModal({ open: true, image: img });
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {images.map((img, i) => (
        <div key={i} style={{ width: 300, border: '1px solid #3949ab', borderRadius: 12, overflow: 'hidden', position: 'relative', background: '#23294a', color: '#fff', boxShadow: '0 2px 8px #0004' }}>
          <div onClick={() => onImageClick(img)} style={{ cursor: 'pointer' }}>
            {img.media_type === 'image' ? (
              <img src={img.url} alt={img.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
            ) : (
              <video controls style={{ width: '100%', height: 180, objectFit: 'cover' }}>
                <source src={img.url} type="video/mp4" />
                Tarayıcınız video etiketini desteklemiyor.
              </video>
            )}
          </div>
          <div style={{ padding: 12 }}>
            <h3 style={{ color: '#ffe082', fontSize: 18 }}>{img.title}</h3>
            <p style={{ color: '#b0bec5', fontSize: 13 }}>{img.date}</p>
          </div>
          {/* Etkileşim butonları */}
          <div style={{ display: 'flex', gap: 16, padding: 12, alignItems: 'center', borderTop: '1px solid #3949ab' }}>
            <button onClick={() => handleLike(img)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: likeStates[img.date]?.liked ? '#e53935' : '#fff', fontSize: 22, display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 4 }}>{likeStates[img.date]?.liked ? '❤️' : '🤍'}</span>
              <span style={{ fontSize: 15 }}>{likeStates[img.date]?.count || 0}</span>
            </button>
            <button onClick={() => handleComment(img)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 22, display: 'flex', alignItems: 'center' }}>
              💬 <span style={{ fontSize: 15, marginLeft: 4 }}>{commentCounts[img.date] || 0}</span>
            </button>
            <button onClick={() => handleSave(img)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 22 }}>
              📥
            </button>
            <button onClick={() => handleShare(img)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 22 }}>
              🔗
            </button>
          </div>
        </div>
      ))}
      {/* Yorum modalı */}
      <ImageModal open={commentModal.open} onClose={() => setCommentModal({ open: false, image: null })} image={commentModal.image} user={user} />
      {/* Koleksiyona kaydet modalı */}
      <CollectionModal open={collectionModal.open} onClose={() => setCollectionModal({ open: false, image: null })} user={user} image={collectionModal.image} />
      {/* Paylaş modalı */}
      <ShareModal open={shareModal.open} onClose={() => setShareModal({ open: false, image: null })} user={user} image={shareModal.image} />
    </div>
  );
};

export default ImageFeed; 