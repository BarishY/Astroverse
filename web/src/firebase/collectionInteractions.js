import { db } from "./config";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";

const collectionInteractionsRef = collection(db, "collection_interactions");

// Koleksiyona beğeni ekle
export const addLikeToCollection = async (collectionId, userId) => {
  await addDoc(collectionInteractionsRef, {
    collectionId,
    userId,
    type: "like",
    createdAt: new Date()
  });
  await updateCollectionPopularity(collectionId);
};

// Koleksiyona yorum ekle
export const addCommentToCollection = async (collectionId, userId, comment) => {
  await addDoc(collectionInteractionsRef, {
    collectionId,
    userId,
    type: "comment",
    comment,
    createdAt: new Date()
  });
  await updateCollectionPopularity(collectionId);
};

// Koleksiyona ait beğenileri getir
export const getLikesForCollection = async (collectionId) => {
  const q = query(collectionInteractionsRef, where("collectionId", "==", collectionId), where("type", "==", "like"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Koleksiyona ait yorumları getir
export const getCommentsForCollection = async (collectionId) => {
  const q = query(collectionInteractionsRef, where("collectionId", "==", collectionId), where("type", "==", "comment"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Koleksiyonun popularity alanını güncelle (beğeni+yorum toplamı)
export const updateCollectionPopularity = async (collectionId) => {
  const q = query(collectionInteractionsRef, where("collectionId", "==", collectionId));
  const snapshot = await getDocs(q);
  const popularity = snapshot.docs.length;
  const colRef = doc(db, "collections", collectionId);
  await updateDoc(colRef, { popularity });
};

// Belirli bir koleksiyon ve kullanıcı için beğeniyi kaldır
export const removeLikeFromCollection = async (collectionId, userId) => {
  const q = query(collectionInteractionsRef, where("collectionId", "==", collectionId), where("type", "==", "like"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  for (const d of snapshot.docs) {
    await deleteDoc(d.ref);
  }
  await updateCollectionPopularity(collectionId);
}; 