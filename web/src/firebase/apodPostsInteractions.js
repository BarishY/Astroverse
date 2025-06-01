import { db } from "./config";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";

const apodPostsInteractionsRef = collection(db, "apod_posts_interactions");

// Beğeni ekle
export const addLikeToPost = async (postId, userId) => {
  await addDoc(apodPostsInteractionsRef, {
    postId,
    userId,
    type: "like",
    createdAt: new Date()
  });
};

// Yorum ekle
export const addCommentToPost = async (postId, userId, comment) => {
  await addDoc(apodPostsInteractionsRef, {
    postId,
    userId,
    type: "comment",
    comment,
    createdAt: new Date()
  });
};

// Posta ait beğenileri getir
export const getLikesForPost = async (postId) => {
  const q = query(apodPostsInteractionsRef, where("postId", "==", postId), where("type", "==", "like"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Posta ait yorumları getir
export const getCommentsForPost = async (postId) => {
  const q = query(apodPostsInteractionsRef, where("postId", "==", postId), where("type", "==", "comment"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Belirli bir postId ve userId için beğeniyi kaldır
export const removeLikeFromPost = async (postId, userId) => {
  const q = query(apodPostsInteractionsRef, where("postId", "==", postId), where("type", "==", "like"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  for (const d of snapshot.docs) {
    await deleteDoc(doc(db, "apod_posts_interactions", d.id));
  }
}; 