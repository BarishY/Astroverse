import React, { useEffect, useState } from "react";
import { getLikesForPost, addLikeToPost, getCommentsForPost, addCommentToPost } from "../firebase/apodPostsInteractions";
import CollectionModal from "./CollectionModal";
import { getUserByUid } from "../firebase/users";

const ImageModal = ({ open, onClose, image, user }) => {
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [commentUsers, setCommentUsers] = useState({});

  useEffect(() => {
    if (!image) return;
    // Beğenileri ve yorumları çek (ilk açılışta ve her 2sn'de bir)
    let mounted = true;
    const fetchData = async () => {
      const likesData = await getLikesForPost(image.date);
      const commentsData = await getCommentsForPost(image.date);
      if (mounted) {
        setLikes(likesData);
        setComments(commentsData);
        // Yorum yapan kullanıcıların adlarını çek
        const userIds = Array.from(new Set(commentsData.map(c => c.userId)));
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
  }, [image]);

  const handleLike = async () => {
    if (!user) return;
    setLikeLoading(true);
    await addLikeToPost(image.date, user.uid);
    const updatedLikes = await getLikesForPost(image.date);
    setLikes(updatedLikes);
    setLikeLoading(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    setCommentLoading(true);
    await addCommentToPost(image.date, user.uid, commentText.trim());
    setCommentText("");
    const updatedComments = await getCommentsForPost(image.date);
    setComments(updatedComments);
    setCommentLoading(false);
  };

  if (!open || !image) return null;
  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 600, width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8 }}>Kapat</button>
          <h2>{image.title}</h2>
          {image.media_type === 'image' ? (
            <img src={image.url} alt={image.title} style={{ width: '100%', borderRadius: 8 }} />
          ) : (
            <video controls autoPlay style={{ width: '100%', borderRadius: 8 }}>
              <source src={image.url} type="video/mp4" />
              Tarayıcınız video etiketini desteklemiyor.
            </video>
          )}
          <p>{image.explanation}</p>
          {/* Etkileşim butonları (NASA sekmesiyle aynı) */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'center', borderTop: '1px solid #3949ab', paddingTop: 12 }}>
            <button onClick={handleLike} disabled={likeLoading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: likes.some(l => l.userId === user?.uid) ? '#e53935' : '#23294a', fontSize: 22, display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 4 }}>{likes.some(l => l.userId === user?.uid) ? '❤️' : '🤍'}</span>
              <span style={{ fontSize: 15 }}>{likes.length}</span>
            </button>
            <button onClick={() => setCollectionModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#23294a', fontSize: 22 }}>
              📥
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.origin + "?apod=" + image.date); alert("Bağlantı kopyalandı!"); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#23294a', fontSize: 22 }}>
              🔗
            </button>
          </div>
          <div style={{ marginTop: 16 }}>
            <h4>Yorumlar</h4>
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Yorum ekle..."
                style={{ flex: 1 }}
                disabled={!user || commentLoading}
              />
              <button type="submit" disabled={!user || commentLoading || !commentText.trim()}>{commentLoading ? "..." : "Ekle"}</button>
            </form>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {comments.length === 0 && <div>Henüz yorum yok.</div>}
              {[...comments].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(c => (
                <div key={c.id} style={{ borderBottom: '1px solid #eee', padding: 4 }}>
                  <b>{commentUsers[c.userId] || c.userId}</b>: {c.comment}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <CollectionModal
        open={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
        user={user}
        image={image}
      />
    </>
  );
};

export default ImageModal; 