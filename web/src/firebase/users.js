import { db } from "./config";
import { collection, addDoc, getDocs, updateDoc, doc, query, where, getDoc } from "firebase/firestore";

const usersRef = collection(db, "users");
const followsRef = collection(db, "follows");

// Kullanıcı ekle
export const addUser = async (uid, data) => {
  await addDoc(usersRef, {
    uid,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });
};

// Kullanıcı güncelle
export const updateUser = async (userId, data) => {
  const docRef = doc(db, "users", userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date()
  });
};

// Kullanıcıyı uid ile getir
export const getUserByUid = async (uid) => {
  const q = query(usersRef, where("uid", "==", uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

// users koleksiyonundaki followers dizisini getir
export const getUserFollowers = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) return [];
  const data = userDoc.data();
  return data.followers || [];
};

// users koleksiyonundaki following dizisini getir
export const getUserFollowing = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) return [];
  const data = userDoc.data();
  return data.following || [];
};

// Takipçi sayısını getir (follows koleksiyonundan)
export const getFollowersCount = async (userId) => {
  const q = query(followsRef, where("toId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.size;
};

// Takip edilen (following) sayısını getir (follows koleksiyonundan)
export const getFollowingCount = async (userId) => {
  const q = query(followsRef, where("fromId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.size;
}; 