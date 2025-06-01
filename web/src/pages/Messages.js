import React, { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { getUserFollowers, getUserFollowing, getUserByUid } from "../firebase/users";
import { db } from "../firebase/config";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import ImageModal from "../components/ImageModal";

const getChatId = (uid1, uid2) => [uid1, uid2].sort().join("_");

const Messages = () => {
  const [user, setUser] = useState(null);
  const [mutuals, setMutuals] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastMessages, setLastMessages] = useState({});
  const [lastRead, setLastRead] = useState({});
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const followers = await getUserFollowers(firebaseUser.uid);
        const following = await getUserFollowing(firebaseUser.uid);
        const mutualIds = followers.filter((f) => following.includes(f));
        const mutualUsers = await Promise.all(mutualIds.map(getUserByUid));
        setMutuals(mutualUsers.filter(Boolean));
      } else {
        setUser(null);
        setMutuals([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !selectedUser) return;
    setChatUser(selectedUser);
    const chatId = getChatId(user.uid, selectedUser.uid);

    const q = query(collection(db, "messages", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);

      // Update lastRead
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg?.from === selectedUser.uid) {
        setLastRead((prev) => ({
          ...prev,
          [selectedUser.uid]: lastMsg.createdAt?.seconds || Date.now() / 1000,
        }));
      }

      // Update lastMessages
      setLastMessages((prev) => ({
        ...prev,
        [selectedUser.uid]: lastMsg,
      }));
    });

    return () => unsubscribe();
  }, [user, selectedUser]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !user || !chatUser) return;

    const chatId = getChatId(user.uid, chatUser.uid);
    const newMsg = {
      text: messageText.trim(),
      from: user.uid,
      to: chatUser.uid,
      createdAt: serverTimestamp(),
      type: "text",
    };

    setMessageText("");
    await addDoc(collection(db, "messages", chatId, "messages"), newMsg);
  };

  const sortedMutuals = [...mutuals].sort((a, b) => {
    const aTime = lastMessages[a.uid]?.createdAt?.seconds || 0;
    const bTime = lastMessages[b.uid]?.createdAt?.seconds || 0;
    return bTime - aTime;
  });

  if (loading) return <div style={{ color: '#90caf9', textAlign: 'center', marginTop: 40 }}>Yükleniyor...</div>;
  if (!user) return <div style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>Giriş yapmalısınız.</div>;

  return (
    <div style={{ display: 'flex', height: '80vh', background: '#181c2b', borderRadius: 16, boxShadow: '0 4px 24px #0006', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: '#23294a', borderRight: '1px solid #3949ab', padding: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ color: '#ffe082', fontWeight: 700, fontSize: 22, textAlign: 'center', padding: 20 }}>Mesajlar</div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sortedMutuals.map(u => {
            const lastMsg = lastMessages[u.uid];
            const unread = lastMsg && lastMsg.from === u.uid && (!lastRead[u.uid] || (lastMsg.createdAt?.seconds || 0) > lastRead[u.uid]);
            return (
              <div key={u.uid} onClick={() => setSelectedUser(u)}
                style={{ padding: 16, cursor: 'pointer', background: selectedUser?.uid === u.uid ? '#3949ab' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #23294a' }}>
                <span style={{ fontSize: 24 }}>🪐</span>
                <div>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {u.displayName || u.username}
                    {unread && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e53935', display: 'inline-block' }}></span>}
                  </div>
                  <div style={{ color: '#90caf9', fontSize: 13 }}>@{u.username || u.uid}</div>
                  <div style={{ color: '#b0bec5', fontSize: 13, maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lastMsg?.text || <span style={{ color: '#3949ab' }}>Henüz mesaj yok</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {chatUser ? (
          <>
            <div style={{ padding: 20, borderBottom: '1px solid #3949ab', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 28 }}>🪐</span>
              <div>
                <div style={{ fontWeight: 700, color: '#ffe082', fontSize: 20 }}>{chatUser.displayName || chatUser.username}</div>
                <div style={{ color: '#90caf9', fontSize: 14 }}>@{chatUser.username || chatUser.uid}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.from === user.uid ? 'flex-end' : 'flex-start',
                    background: msg.from === user.uid ? '#3949ab' : '#23294a',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '10px 18px',
                    maxWidth: 340,
                    fontSize: 16
                  }}
                >
                  {msg.text}
                  <div style={{ color: '#b0bec5', fontSize: 11, marginTop: 4, textAlign: 'right' }}>
                    {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              ))}
              <ImageModal open={!!modalImage} onClose={() => setModalImage(null)} image={modalImage} user={user} showActions />
            </div>
            <form onSubmit={handleSend} style={{ display: 'flex', padding: 16, borderTop: '1px solid #3949ab', background: '#23294a' }}>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Mesajınızı yazın..."
                style={{ flex: 1, border: 'none', borderRadius: 8, padding: 12, fontSize: 16, background: '#181c2b', color: '#fff', outline: 'none' }}
              />
              <button type="submit" style={{ marginLeft: 12, background: '#ffe082', color: '#181c2b', border: 'none', borderRadius: 8, padding: '0 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                Gönder
              </button>
            </form>
          </>
        ) : (
          <div style={{ color: '#90caf9', textAlign: 'center', marginTop: 80, fontSize: 20 }}>
            Sohbet başlatmak için bir kullanıcı seçin.
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;