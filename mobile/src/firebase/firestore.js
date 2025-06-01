// src/firebase/firestore.js
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    arrayUnion,
    arrayRemove,
    onSnapshot,
    Timestamp,
    serverTimestamp,
    orderBy,
    limit,
    writeBatch,
    deleteDoc,
    startAt,
    endAt,
    increment
  } from 'firebase/firestore';
  import { db, auth } from './config'; // Firebase config dosyamız
  import { fetchApodByDate } from '../services/nasaApi'; // NASA API servisimiz
  
  // Koleksiyon adları
  const APOD_POSTS_COLLECTION = "apod_posts_interactions"; // NASA APOD gönderi etkileşimleri için
  const USERS_COLLECTION = "users";
  const COLLECTIONS_COLLECTION = "collections";
  const COLLECTION_INTERACTIONS_COLLECTION = 'collection_interactions';
  
  /**
   * Firestore'da bir NASA APOD gönderisi için etkileşim belgesini alır veya oluşturur.
   * postId genellikle APOD'un 'YYYY-MM-DD' formatındaki tarihidir.
   * postTitle ve postUrl, gönderi ilk kez etkileşim aldığında kaydedilir.
   */
  export const getNasaApodPostInteractionRef = async (postId, postTitle = null, postUrl = null, mediaType = null) => {
    if (!postId) {
      console.error("getNasaApodPostInteractionRef: postId gereklidir.");
      return null;
    }
    const postRef = doc(db, APOD_POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
  
    if (!postSnap.exists()) {
      // Gönderi etkileşim belgesi yoksa oluştur
      try {
        const initialData = {
          postId: postId,
          likes: [],
          comments: [],
          savedInCollections: [], // Hangi koleksiyonlarda kaç kişi tarafından kaydedildiği
                                  // [{ userId, collectionId, collectionName }]
        };
        if (postTitle) initialData.title = postTitle;
        if (postUrl) initialData.url = postUrl; // Gönderinin ana URL'si (resim veya video)
        if (mediaType) initialData.mediaType = mediaType;
        initialData.firstInteractionAt = serverTimestamp();
  
        await setDoc(postRef, initialData);
        console.log(`Firestore'da APOD gönderi etkileşim belgesi oluşturuldu: ${postId}`);
      } catch (error) {
        console.error("APOD gönderi etkileşim belgesi oluşturma hatası:", error);
        throw error;
      }
    }
    return postRef;
  };
  
  /**
   * Bir NASA APOD gönderisine yapılan beğeniyi değiştirir (ekler/kaldırır).
   */
  export const toggleLikeOnNasaApodPost = async (postId, userId, postTitle, postUrl, mediaType) => {
    if (!userId) throw new Error("Kullanıcı ID'si gerekli.");
    const postRef = await getNasaApodPostInteractionRef(postId, postTitle, postUrl, mediaType);
    if (!postRef) return;
  
    const postSnap = await getDoc(postRef); // Güncel durumu al
    if (!postSnap.exists()) {
      console.error("toggleLikeOnNasaApodPost: Gönderi etkileşim belgesi bulunamadı.");
      return;
    }
  
    const postData = postSnap.data();
    if (postData.likes && postData.likes.includes(userId)) {
      await updateDoc(postRef, { likes: arrayRemove(userId) });
      console.log(`Beğeni kaldırıldı: ${postId} by ${userId}`);
    } else {
      await updateDoc(postRef, { likes: arrayUnion(userId) });
      console.log(`Beğeni eklendi: ${postId} by ${userId}`);
    }
  };
  
  /**
   * Bir NASA APOD gönderisinin etkileşimlerini (beğeni, yorum) canlı olarak dinler.
   */
  export const listenToNasaApodPostInteractions = (postId, callback) => {
    if (!postId) {
      console.warn("listenToNasaApodPostInteractions: postId sağlanmadı.");
      callback({ likes: [], comments: [] }); // Boş veri ile callback çağır
      return () => {}; // Boş bir unsubscribe fonksiyonu döndür
    }
    const postRef = doc(db, APOD_POSTS_COLLECTION, postId);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        // Belge yoksa, ilk etkileşimde oluşturulmasını bekleyebiliriz veya boş dönebiliriz.
        callback({ likes: [], comments: [], savedInCollections: [] });
      }
    }, (error) => {
      console.error(`Etkileşim dinleme hatası (${postId}):`, error);
      callback(null);
    });
    return unsubscribe;
  };
  
  /**
   * Bir NASA APOD gönderisine yorum ekler.
   */
  export const addCommentToNasaApodPost = async (postId, userId, username, text, postTitle, postUrl, mediaType) => {
    if (!userId || !username) throw new Error("Kullanıcı bilgileri eksik.");
    if (!text.trim()) throw new Error("Yorum metni boş olamaz.");
    const postRef = await getNasaApodPostInteractionRef(postId, postTitle, postUrl, mediaType);
    if (!postRef) return;
  
    const newComment = {
      userId: userId,
      username: username,
      text: text.trim(),
      createdAt: Timestamp.now(),
    };
    await updateDoc(postRef, { comments: arrayUnion(newComment) });
    console.log(`Yorum eklendi: ${postId} - ${username}: ${text}`);
  };
  
  /**
   * Kullanıcının profil bilgilerini Firestore'dan getirir.
   */
  export const getUserProfile = async (userId) => {
    if (!userId) return null;
    const userRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.warn(`Kullanıcı profili bulunamadı: ${userId}`);
      return null;
    }
  };
  
  /**
   * Kullanıcının koleksiyonlarının listesini (ID, isim, kapak resmi ve öğe sayısı) getirir.
   */
  export const getUserCollections = async (userId, currentUserId) => {
    try {
      console.log('Koleksiyonlar getiriliyor...', { userId, currentUserId });
      
      // Kullanıcının kendi koleksiyonları için
      if (userId === currentUserId) {
        const collectionsRef = collection(db, 'collections');
        const q = query(
          collectionsRef,
          where('ownerId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const collections = [];
        snapshot.forEach(doc => {
          collections.push({ id: doc.id, ...doc.data() });
        });
        console.log('Kullanıcının kendi koleksiyonları:', collections);
        return collections;
      }

      // Başka bir kullanıcının koleksiyonları için
      const collectionsRef = collection(db, 'collections');
      const q = query(
        collectionsRef,
        where('ownerId', '==', userId),
        where('privacy', 'in', ['public', 'followers'])
      );
      const snapshot = await getDocs(q);
      const collections = [];
      
      // Takipçi kontrolü
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const isFollower = (userData?.followers || []).includes(currentUserId);
      
      console.log('Takipçi durumu:', { isFollower, followers: userData?.followers });

      snapshot.forEach(doc => {
        const collectionData = doc.data();
        // Eğer koleksiyon takipçilere özel ise ve kullanıcı takipçi değilse, gösterme
        if (collectionData.privacy === 'followers' && !isFollower) {
          return;
        }
        collections.push({ id: doc.id, ...collectionData });
      });

      console.log('Görüntülenebilir koleksiyonlar:', collections);
      return collections;
    } catch (error) {
      console.error('Koleksiyonlar getirilirken hata:', error);
      throw error;
    }
  };
  
  /**
   * Yeni bir koleksiyon oluşturur.
   * @param {string} userId - Koleksiyon sahibinin ID'si
   * @param {Object} collectionData - Koleksiyon verileri
   */
  export const createCollection = async (userId, collectionData) => {
    try {
      const collectionRef = collection(db, COLLECTIONS_COLLECTION);
      const now = Timestamp.now();
      const newCollection = {
        ...collectionData,
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
        items: [],
        likeCount: 0,
        commentCount: 0,
        likes: [],
        comments: []
      };

      const docRef = await addDoc(collectionRef, newCollection);
      return {
        id: docRef.id,
        ...newCollection
      };
    } catch (error) {
      console.error("Koleksiyon oluşturulurken hata:", error);
      throw error;
    }
  };
  
  /**
   * Bir APOD gönderisini bir koleksiyona ekler/kaldırır.
   */
  export const toggleSaveToCollection = async (collectionId, postId, postTitle, postMediaType, postUrl) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Giriş yapmalısınız.");
    if (!collectionId || !postId) throw new Error("Koleksiyon ID ve Gönderi ID gerekli.");
  
    const collectionRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    const collectionSnap = await getDoc(collectionRef);
  
    if (!collectionSnap.exists()) throw new Error("Koleksiyon bulunamadı.");
    const collectionData = collectionSnap.data();
    if (collectionData.ownerId !== user.uid) throw new Error("Bu koleksiyon size ait değil.");
  
    // Gönderi için etkileşim belgesini al/oluştur (başlık, url gibi bilgileri oradan da alabiliriz)
    await getNasaApodPostInteractionRef(postId, postTitle, postUrl, postMediaType);
  
    const itemToToggle = {
      postId: postId,
      type: 'apod',
      addedAt: Timestamp.now(),
      // Bu bilgiler zaten APOD_POSTS_COLLECTION'da olacak, burada tekrar tutmak gerekmeyebilir
      // title: postTitle,
      // mediaType: postMediaType,
      // url: postUrl,
    };
  
    const existingItemIndex = collectionData.items.findIndex(item => item.postId === postId);
    let newItemsArray;
    let operationType; // 'added' or 'removed'
  
    if (existingItemIndex > -1) {
      // Öğe varsa kaldır
      newItemsArray = collectionData.items.filter(item => item.postId !== postId);
      operationType = 'removed';
    } else {
      // Öğe yoksa ekle
      newItemsArray = [itemToToggle, ...collectionData.items.filter(item => item.postId !== postId)]; // Yeni item başa
      operationType = 'added';
    }
  
    // Koleksiyonu güncelle
    const updateData = {
      items: newItemsArray,
      updatedAt: serverTimestamp(),
    };
  
    // Kapak resmini ayarla/güncelle (her zaman en güncel item'ın url'si)
    if (newItemsArray.length > 0) {
      const sortedItems = [...newItemsArray].sort((a, b) => {
        if (a.addedAt && b.addedAt) {
          return b.addedAt.seconds - a.addedAt.seconds;
        }
        return 0;
      });
      const lastItem = sortedItems[0];
      if (lastItem && lastItem.postId) {
        const apod = await fetchApodByDate(lastItem.postId);
        updateData.coverImage = apod?.url || null;
      } else {
        updateData.coverImage = null;
      }
    } else {
      updateData.coverImage = null;
    }
  
    await updateDoc(collectionRef, updateData);
    console.log(`${postId} koleksiyona ${operationType === 'added' ? 'eklendi' : 'kaldırıldı'}: ${collectionId}`);
  
    // `apod_posts_interactions` koleksiyonundaki `savedInCollections` alanını güncelle
    const apodPostRef = doc(db, APOD_POSTS_COLLECTION, postId);
    const apodPostSnap = await getDoc(apodPostRef);
    if (apodPostSnap.exists()) {
      const savedEntry = { userId: user.uid, collectionId: collectionId, collectionName: collectionData.name };
      if (operationType === 'removed') {
        await updateDoc(apodPostRef, { savedInCollections: arrayRemove(savedEntry) });
      } else {
        await updateDoc(apodPostRef, { savedInCollections: arrayUnion(savedEntry) });
      }
    }
    return operationType; // İşlem tipini döndür
  };
  
  
  /**
   * Belirli bir koleksiyonun tüm detaylarını (öğeler dahil) getirir.
   */
  export const getCollectionDetailsWithItems = async (collectionId) => {
    if (!collectionId) return null;
    const collectionRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    const collectionSnap = await getDoc(collectionRef);
  
    if (!collectionSnap.exists()) {
      console.warn(`Koleksiyon bulunamadı: ${collectionId}`);
      return null;
    }
  
    const collectionData = collectionSnap.data();
    const itemPostIds = collectionData.items?.map(item => item.postId) || [];
  
    if (itemPostIds.length === 0) {
      return { id: collectionSnap.id, ...collectionData, itemsData: [] };
    }
  
    // APOD gönderilerinin detaylarını NASA API'den çek (veya cache'den/Firestore'dan)
    // Bu kısım performans için optimize edilebilir (örneğin, tüm bilgileri items içinde tutmak)
    const itemDetailsPromises = itemPostIds.map(postId => fetchApodByDate(postId));
    const itemsData = (await Promise.all(itemDetailsPromises)).filter(item => item !== null);
  
    return { id: collectionSnap.id, ...collectionData, itemsData };
  };
  
  /**
   * Herkese açık son koleksiyonları getirir (Keşfet için).
   * @param {number} count - Getirilecek koleksiyon sayısı.
   */
  export const getRecentPublicCollections = async (count = 10) => {
    try {
      console.log('Son koleksiyonlar getiriliyor...');
      
      const q = query(
        collection(db, COLLECTIONS_COLLECTION),
        where("privacy", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(count)
      );

      const querySnapshot = await getDocs(q);
      console.log('Bulunan koleksiyon sayısı:', querySnapshot.docs.length);

      const collectionsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Timestamp'i Date objesine çevir
        const createdAt = data.createdAt?.toDate?.() || new Date();
        
        console.log('Koleksiyon:', {
          id: doc.id,
          name: data.name,
          privacy: data.privacy,
          createdAt: createdAt,
          itemCount: data.items?.length || 0
        });
        
        return {
          id: doc.id,
          ...data,
          createdAt: createdAt,
          itemCount: data.items?.length || 0,
        };
      });

      // Oluşturulma tarihine göre sırala (en yeniden en eskiye)
      collectionsList.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      return { collections: collectionsList };
    } catch (error) {
      console.error("Son herkese açık koleksiyonlar alınırken hata:", error);
      throw error;
    }
  };
  
  /**
   * Kullanıcı adının başına göre arama (case-insensitive, prefix search)
   */
  export const searchUsers = async (usernameQuery) => {
    if (!usernameQuery) return [];
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      orderBy("username"),
      startAt(usernameQuery),
      endAt(usernameQuery + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  };
  
  /**
   * Bir kullanıcıyı takip et
   */
  export const followUser = async (followerId, followingId) => {
    if (!followerId || !followingId) throw new Error('Takip için kullanıcı ID gerekli.');
    const followerRef = doc(db, USERS_COLLECTION, followerId);
    const followingRef = doc(db, USERS_COLLECTION, followingId);
    await updateDoc(followerRef, { following: arrayUnion(followingId) });
    await updateDoc(followingRef, { followers: arrayUnion(followerId) });
  };
  
  /**
   * Bir kullanıcıyı takipten çıkar
   */
  export const unfollowUser = async (followerId, followingId) => {
    if (!followerId || !followingId) throw new Error('Takipten çıkmak için kullanıcı ID gerekli.');
    const followerRef = doc(db, USERS_COLLECTION, followerId);
    const followingRef = doc(db, USERS_COLLECTION, followingId);
    await updateDoc(followerRef, { following: arrayRemove(followingId) });
    await updateDoc(followingRef, { followers: arrayRemove(followerId) });
  };
  
  /**
   * Koleksiyonun adını ve gizliliğini günceller.
   */
  export const updateCollectionDetails = async (collectionId, { name, privacy }) => {
    if (!collectionId) throw new Error('Koleksiyon ID gerekli');
    const collectionRef = doc(db, 'collections', collectionId);
    const updateObj = {};
    if (name !== undefined) updateObj.name = name;
    if (privacy !== undefined) updateObj.privacy = privacy;
    await updateDoc(collectionRef, updateObj);
  };
  
  /**
   * Kullanıcının takip ettiği kişilerin herkese açık ve takipçilere özel koleksiyonlarını getirir.
   * @param {string} userId - Şu anki kullanıcının ID'si
   * @returns {Promise<Array>} - Görüntülenebilir koleksiyonlar
   */
  export const getFeedCollectionsForUser = async (userId) => {
    if (!userId) return [];
    // Önce kullanıcının takip ettiklerini al
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return [];

    const following = userSnap.data().following || [];
    if (following.length === 0) return [];

    // Firestore 'in' sorgusu max 10 eleman alır, gerekirse bölerek sorgula
    const batchSize = 10;
    let allCollections = [];
    for (let i = 0; i < following.length; i += batchSize) {
      const batch = following.slice(i, i + batchSize);
      const collectionsRef = collection(db, COLLECTIONS_COLLECTION);
      const q = query(
        collectionsRef,
        where('ownerId', 'in', batch),
        where('privacy', 'in', ['public', 'followers'])
      );
      const snapshot = await getDocs(q);
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Herkese açık koleksiyonlar direkt eklenir
        if (data.privacy === 'public') {
          allCollections.push({ id: docSnap.id, ...data });
        } else if (data.privacy === 'followers') {
          // Takip edilen kullanıcıya gerçekten takipçi misin kontrolü
          // (Zaten following listesinde olduğu için eklenebilir)
          allCollections.push({ id: docSnap.id, ...data });
        }
      });
    }
    // Son eklenenler en üstte olacak şekilde sırala
    allCollections.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return allCollections;
  };
  
  /**
   * Koleksiyon etkileşim belgesini alır veya oluşturur
   */
  export const getCollectionInteractionRef = async (collectionId) => {
    if (!collectionId) throw new Error("Koleksiyon ID'si gerekli.");
    
    const interactionRef = doc(db, COLLECTION_INTERACTIONS_COLLECTION, collectionId);
    const interactionSnap = await getDoc(interactionRef);
    
    if (!interactionSnap.exists()) {
      // Yeni etkileşim belgesi oluştur
      await setDoc(interactionRef, {
        collectionId,
        likes: [],
        comments: [],
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return interactionRef;
  };
  
  /**
   * Koleksiyona beğeni ekler/kaldırır
   */
  export const toggleLikeCollection = async (collectionId, userId) => {
    if (!collectionId || !userId) throw new Error("Koleksiyon ID ve Kullanıcı ID gerekli.");
    
    const interactionRef = await getCollectionInteractionRef(collectionId);
    const interactionSnap = await getDoc(interactionRef);
    const interactionData = interactionSnap.data();
    
    const isLiked = interactionData.likes.includes(userId);
    
    if (isLiked) {
      // Beğeniyi kaldır
      await updateDoc(interactionRef, {
        likes: arrayRemove(userId),
        likeCount: increment(-1),
        updatedAt: serverTimestamp()
      });
    } else {
      // Beğeni ekle
      await updateDoc(interactionRef, {
        likes: arrayUnion(userId),
        likeCount: increment(1),
        updatedAt: serverTimestamp()
      });
    }
    
    return !isLiked; // Yeni beğeni durumunu döndür
  };
  
  /**
   * Koleksiyona yorum ekler
   */
  export const addCommentToCollection = async (collectionId, userId, username, text) => {
    if (!collectionId || !userId || !username) throw new Error("Koleksiyon ID, Kullanıcı ID ve kullanıcı adı gerekli.");
    if (!text.trim()) throw new Error("Yorum metni boş olamaz.");
    
    const interactionRef = await getCollectionInteractionRef(collectionId);
    
    const newComment = {
      id: doc(collection(db, 'temp')).id, // Geçici ID oluştur
      userId,
      username,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      likes: [],
      likeCount: 0
    };
    
    await updateDoc(interactionRef, {
      comments: arrayUnion(newComment),
      commentCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    return newComment;
  };
  
  /**
   * Koleksiyon yorumunu beğenir/beğeniyi kaldırır
   */
  export const toggleLikeCollectionComment = async (collectionId, commentId, userId) => {
    if (!collectionId || !commentId || !userId) throw new Error("Koleksiyon ID, Yorum ID ve Kullanıcı ID gerekli.");
    
    const interactionRef = doc(db, COLLECTION_INTERACTIONS_COLLECTION, collectionId);
    const interactionSnap = await getDoc(interactionRef);
    const interactionData = interactionSnap.data();
    
    const comment = interactionData.comments.find(c => c.id === commentId);
    if (!comment) throw new Error("Yorum bulunamadı.");
    
    const isLiked = comment.likes.includes(userId);
    const updatedComments = interactionData.comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          likes: isLiked ? c.likes.filter(id => id !== userId) : [...c.likes, userId],
          likeCount: isLiked ? c.likeCount - 1 : c.likeCount + 1
        };
      }
      return c;
    });
    
    await updateDoc(interactionRef, {
      comments: updatedComments,
      updatedAt: serverTimestamp()
    });
    
    return !isLiked;
  };
  
  /**
   * Koleksiyon etkileşimlerini dinler
   */
  export const subscribeToCollectionInteractions = (collectionId, callback) => {
    if (!collectionId) throw new Error("Koleksiyon ID'si gerekli.");
    
    const interactionRef = doc(db, COLLECTION_INTERACTIONS_COLLECTION, collectionId);
    return onSnapshot(interactionRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      } else {
        callback(null);
      }
    });
  };
  
  /**
   * En popüler koleksiyonları getirir (beğeni ve yoruma göre sıralı)
   * @param {number} count - Kaç koleksiyon getirilsin
   * @returns {Promise<Array>} - Popüler koleksiyonlar
   */
  export const getPopularCollections = async (count = 20) => {
    // Tüm collection_interactions belgelerini çek
    const q = query(collection(db, COLLECTION_INTERACTIONS_COLLECTION));
    const snapshot = await getDocs(q);
    const interactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Beğeni ve yoruma göre sırala
    const sorted = interactions.sort((a, b) => {
      // Önce beğeniye, eşitse yoruma göre
      if ((b.likeCount || 0) !== (a.likeCount || 0)) {
        return (b.likeCount || 0) - (a.likeCount || 0);
      }
      return (b.commentCount || 0) - (a.commentCount || 0);
    }).slice(0, count);

    // Her birinin koleksiyon detayını çek
    const collectionDetails = await Promise.all(
      sorted.map(async (interaction) => {
        const colRef = doc(db, COLLECTIONS_COLLECTION, interaction.collectionId);
        const colSnap = await getDoc(colRef);
        if (!colSnap.exists()) return null;
        return {
          id: colSnap.id,
          ...colSnap.data(),
          likeCount: interaction.likeCount || 0,
          commentCount: interaction.commentCount || 0,
        };
      })
    );

    // null olanları filtrele
    return collectionDetails.filter(Boolean);
  };
  
  /**
   * İki kullanıcı arasında benzersiz bir conversationId üretir (küçükten büyüğe sıralı)
   */
  export const getConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
  };
  
  /**
   * Bir sohbete mesaj gönderir
   */
  export const sendMessage = async (conversationId, fromUser, toUser, text) => {
    if (!conversationId || !fromUser?.uid || !toUser?.uid || !text.trim()) throw new Error('Eksik parametre');
    const msgRef = collection(db, 'messages', conversationId, 'messages');
    await addDoc(msgRef, {
      from: fromUser.uid,
      fromUsername: fromUser.username || fromUser.displayName || '',
      to: toUser.uid,
      toUsername: toUser.username || toUser.displayName || '',
      text: text.trim(),
      createdAt: serverTimestamp(),
      seen: false,
    });
  };
  
  /**
   * Bir sohbetin mesajlarını canlı olarak dinler (en yeni 50 mesaj, tarihe göre artan)
   */
  export const subscribeToMessages = (conversationId, callback) => {
    if (!conversationId) return () => {};
    const msgsRef = collection(db, 'messages', conversationId, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(messages);
    });
  };
  
  /**
   * Bir sohbetin son mesajını getirir
   */
  export const getLastMessage = async (conversationId) => {
    if (!conversationId) return null;
    const msgsRef = collection(db, 'messages', conversationId, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  };
  
  /**
   * Kullanıcının takip ettiği kişilerin koleksiyonlarını getirir.
   * @param {string} userId - Mevcut kullanıcının ID'si
   */
  export const getFollowingCollections = async (userId) => {
    try {
      // Önce kullanıcının takip ettiği kişileri al
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const following = userData?.following || [];

      if (following.length === 0) {
        return [];
      }

      // Takip edilen kullanıcıların koleksiyonlarını getir
      const collectionsRef = collection(db, 'collections');
      const q = query(
        collectionsRef,
        where('ownerId', 'in', following),
        where('privacy', 'in', ['public', 'followers']),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const collections = [];

      // Her koleksiyon için takipçi kontrolü yap
      for (const doc of snapshot.docs) {
        const collectionData = doc.data();
        
        // Eğer koleksiyon takipçilere özel ise, kullanıcının takipçi olup olmadığını kontrol et
        if (collectionData.privacy === 'followers') {
          const ownerRef = doc(db, 'users', collectionData.ownerId);
          const ownerSnap = await getDoc(ownerRef);
          const ownerData = ownerSnap.data();
          
          // Kullanıcı koleksiyon sahibinin takipçisi değilse, bu koleksiyonu atla
          if (!ownerData?.followers?.includes(userId)) {
            continue;
          }
        }

        collections.push({
          id: doc.id,
          ...collectionData,
          itemCount: collectionData.items?.length || 0
        });
      }

      return collections;
    } catch (error) {
      console.error('Takip edilen kullanıcıların koleksiyonları getirilirken hata:', error);
      throw error;
    }
  };
  
  /**
   * Kullanıcının takipçilerini getirir
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Promise<Array>} Takipçi kullanıcıların listesi
   */
  export const getUserFollowers = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error('Kullanıcı bulunamadı:', userId);
        return [];
      }

      const userData = userDoc.data();
      const followers = userData.followers || [];

      // Her bir takipçinin detaylı bilgilerini getir
      const followersData = await Promise.all(
        followers.map(async (followerId) => {
          const followerRef = doc(db, 'users', followerId);
          const followerDoc = await getDoc(followerRef);
          if (followerDoc.exists()) {
            return {
              uid: followerId,
              ...followerDoc.data()
            };
          }
          return null;
        })
      );

      // Null değerleri filtrele ve döndür
      return followersData.filter(follower => follower !== null);
    } catch (error) {
      console.error('Takipçiler getirilirken hata:', error);
      return [];
    }
  };
  
  /**
   * Kullanıcının takip ettiği kullanıcıları getirir
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Promise<Array>} Takip edilen kullanıcıların listesi
   */
  export const getUserFollowing = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error('Kullanıcı bulunamadı:', userId);
        return [];
      }

      const userData = userDoc.data();
      const following = userData.following || [];

      // Her bir takip edilen kullanıcının detaylı bilgilerini getir
      const followingData = await Promise.all(
        following.map(async (followingId) => {
          const followingRef = doc(db, 'users', followingId);
          const followingDoc = await getDoc(followingRef);
          if (followingDoc.exists()) {
            return {
              uid: followingId,
              ...followingDoc.data()
            };
          }
          return null;
        })
      );

      // Null değerleri filtrele ve döndür
      return followingData.filter(following => following !== null);
    } catch (error) {
      console.error('Takip edilenler getirilirken hata:', error);
      return [];
    }
  };
  
  // TODO:
  // getPopularPublicCollections(count = 10, period = 'weekly') -> Haftalık/Aylık popüler
  // updateCollectionDetails(collectionId, { name, privacy })
  // deleteUserCollection(collectionId, userId)
  // getUserFeedCollections(userId, count, startAfterDoc) -> Takip edilenlerin koleksiyonları
  