import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Koleksiyon oluştur
export const createCollection = async (userId, collectionData) => {
  try {
    const docRef = await addDoc(collection(db, 'collections'), {
      ...collectionData,
      ownerId: userId,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...collectionData, items: [] };
  } catch (error) {
    console.error('Koleksiyon oluşturma hatası:', error);
    throw error;
  }
};

// Kullanıcının koleksiyonlarını getir
export const getUserCollections = async (userId) => {
  try {
    const q = query(
      collection(db, 'collections'),
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Kullanıcı koleksiyonları getirme hatası:', error);
    throw error;
  }
};

// Koleksiyonu sil
export const deleteCollection = async (collectionId) => {
  try {
    await deleteDoc(doc(db, 'collections', collectionId));
    return true;
  } catch (error) {
    console.error('Koleksiyon silme hatası:', error);
    throw error;
  }
}; 