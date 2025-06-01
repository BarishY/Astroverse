import { db } from "./config";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "firebase/firestore";

const messagesRef = collection(db, "messages");

// Mesaj ekle
export const addMessage = async (fromId, toId, text, extra = {}) => {
  await addDoc(messagesRef, {
    from: fromId,
    to: toId,
    text,
    createdAt: serverTimestamp(),
    ...extra
  });
};

// İki kullanıcı arasındaki mesajları getir (tarihe göre sıralı)
export const getMessages = async (userA, userB) => {
  const q = query(
    messagesRef,
    where("from", "in", [userA, userB]),
    where("to", "in", [userA, userB]),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
  // Sadece bu iki kişi arasındaki mesajlar
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(m => (m.from === userA && m.to === userB) || (m.from === userB && m.to === userA));
};

// Kullanıcının mesajlaştığı kişileri ve son mesajı getir
export const getUserChats = async (userId) => {
  const q = query(messagesRef, where("from", "==", userId));
  const snapshot = await getDocs(q);
  const chats = {};
  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data();
    const otherId = data.to;
    if (!chats[otherId] || (chats[otherId].createdAt < data.createdAt)) {
      chats[otherId] = { ...data, id: docSnap.id };
    }
  });
  return Object.values(chats);
}; 