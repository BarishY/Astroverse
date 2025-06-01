import { db } from "./config";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";
import { getLikesForCollection, getCommentsForCollection } from "./collectionInteractions";

const collectionsRef = collection(db, "collections");

// Koleksiyon ekle
export const addCollection = async (userId, name, visibility = "public") => {
  const docRef = await addDoc(collectionsRef, {
    ownerId: userId,
    name,
    privacy: visibility,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return docRef.id;
};

// Koleksiyon güncelle
export const updateCollection = async (collectionId, data) => {
  const docRef = doc(db, "collections", collectionId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date()
  });
};

// Koleksiyon sil
export const deleteCollection = async (collectionId) => {
  const docRef = doc(db, "collections", collectionId);
  await deleteDoc(docRef);
};

// Kullanıcının koleksiyonlarını getir
export const getUserCollections = async (userId) => {
  const q = query(collectionsRef, where("ownerId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Koleksiyonun paylaşım ayarını değiştir
export const setCollectionVisibility = async (collectionId, visibility) => {
  const docRef = doc(db, "collections", collectionId);
  await updateDoc(docRef, { privacy: visibility, updatedAt: new Date() });
};

// Herkese açık koleksiyonları createdAt'e göre azalan sırala
export const getPublicCollections = async () => {
  const q = query(collectionsRef, where("privacy", "==", "public"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Herkese açık koleksiyonları popularity (beğeni+yorum) toplamına göre sırala
export const getPopularCollections = async () => {
  const q = query(collectionsRef, where("privacy", "==", "public"));
  const snapshot = await getDocs(q);
  // popularity: beğeni+yorum toplamı (varsayalım popularity alanı var veya 0)
  return snapshot.docs
    .map(doc => ({ id: doc.id, popularity: doc.data().popularity || 0, ...doc.data() }))
    .sort((a, b) => b.popularity - a.popularity);
};

// Tüm koleksiyonların popularity alanını güncelle (maintenance fonksiyonu)
export const updateAllCollectionsPopularity = async () => {
  const snapshot = await getDocs(collectionsRef);
  for (const docSnap of snapshot.docs) {
    const colId = docSnap.id;
    const likes = await getLikesForCollection(colId);
    const comments = await getCommentsForCollection(colId);
    const popularity = likes.length + comments.length;
    await updateDoc(doc(db, "collections", colId), { popularity });
  }
}; 