import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { fetchLastNasaApodsLast6Months } from './nasaApi'; // fetchLastNasaApods kaldırıldı (kullanılmıyor)
// import { format, addDays, isAfter } from 'date-fns'; // Kullanılmadığı için kaldırıldı

// Astronomy terms and their variations
const ASTRONOMY_TERMS = {
  // Planets and their specific features
  'mars': {
    exact: ['mars'],
    related: ['red planet', 'martian', 'olympus mons', 'valles marineris', 'phobos', 'deimos']
  },
  'jupiter': {
    exact: ['jupiter'],
    related: ['gas giant', 'jovian', 'great red spot', 'io', 'europa', 'ganymede', 'callisto']
  },
  'saturn': {
    exact: ['saturn'],
    related: ['ringed planet', 'saturnian', 'titan', 'enceladus', 'rings', 'cassini']
  },
  'venus': {
    exact: ['venus'],
    related: ['morning star', 'evening star', 'venusian', 'maxwell montes']
  },
  'mercury': {
    exact: ['mercury'],
    related: ['innermost planet', 'caloris basin']
  },
  'neptune': {
    exact: ['neptune'],
    related: ['ice giant', 'triton', 'great dark spot']
  },
  'uranus': {
    exact: ['uranus'],
    related: ['ice giant', 'tilted planet', 'miranda', 'ariel', 'umbriel', 'titania', 'oberon']
  },
  'earth': {
    exact: ['earth'],
    related: ['blue planet', 'terra', 'moon', 'luna']
  },
  
  // Major space objects and their specific names
  'galaxy': {
    exact: ['milky way', 'andromeda', 'triangulum', 'sombrero'],
    related: ['galaxy', 'galactic', 'spiral', 'elliptical', 'irregular']
  },
  'nebula': {
    exact: ['orion nebula', 'crab nebula', 'eagle nebula', 'pillars of creation'],
    related: ['nebula', 'nebular', 'cloud', 'emission', 'reflection', 'planetary']
  },
  'star': {
    exact: ['sun', 'sirius', 'betelgeuse', 'proxima centauri'],
    related: ['star', 'stellar', 'binary', 'pulsar', 'quasar']
  },
  'black hole': {
    exact: ['sagittarius a*', 'cygnus x-1'],
    related: ['black hole', 'singularity', 'event horizon', 'accretion disk']
  },
  'supernova': {
    exact: ['sn 1987a', 'kepler\'s supernova'],
    related: ['supernova', 'nova', 'stellar explosion', 'remnant']
  },
  'comet': {
    exact: ['halley\'s comet', 'hale-bopp', '67p/churyumov-gerasimenko'],
    related: ['comet', 'cometary', 'tail', 'nucleus', 'coma']
  },
  'asteroid': {
    exact: ['ceres', 'vesta', 'eros', 'bennu'],
    related: ['asteroid', 'minor planet', 'belt', 'trojan']
  },
  'meteor': {
    exact: ['leonids', 'perseids', 'geminids'],
    related: ['meteor', 'meteorite', 'shooting star', 'fireball']
  },
  'moon': {
    exact: ['luna', 'phobos', 'deimos', 'titan', 'europa', 'ganymede', 'callisto'],
    related: ['moon', 'lunar', 'satellite', 'crater']
  },
  
  // Spacecraft and missions
  'telescope': {
    exact: ['hubble', 'webb', 'james webb', 'spitzer', 'chandra'],
    related: ['telescope', 'observatory', 'space telescope']
  },
  'satellite': {
    exact: ['sputnik', 'voyager', 'cassini', 'juno', 'perseverance'],
    related: ['satellite', 'orbiter', 'probe', 'spacecraft']
  },
  'rover': {
    exact: ['perseverance', 'curiosity', 'opportunity', 'spirit'],
    related: ['rover', 'lander', 'probe', 'mars rover']
  },
  'spacecraft': {
    exact: ['apollo', 'soyuz', 'dragon', 'starliner'],
    related: ['spacecraft', 'space vehicle', 'probe', 'capsule']
  },
  'mission': {
    exact: ['apollo 11', 'artemis', 'mars 2020', 'james webb'],
    related: ['mission', 'expedition', 'voyage', 'space mission']
  },
  
  // Astronomical events
  'eclipse': {
    exact: ['solar eclipse', 'lunar eclipse', 'total eclipse'],
    related: ['eclipse', 'solar', 'lunar', 'partial']
  },
  'aurora': {
    exact: ['aurora borealis', 'aurora australis'],
    related: ['aurora', 'northern lights', 'southern lights']
  },
  'constellation': {
    exact: ['orion', 'ursa major', 'cassiopeia', 'andromeda'],
    related: ['constellation', 'star pattern', 'zodiac']
  }
};

export async function extractKeywordsWithGemini(title, description) {
  // *** GÜVENLİK UYARISI: API Anahtarını doğrudan koda yazmak ÇOK RİSKLİDİR! ***
  // Bu anahtar kötü niyetli kişiler tarafından ele geçirilip kullanılabilir.
  // Bu anahtarı güvende tutmak için sunucu tarafı bir proxy veya güvenli bir yapılandırma 
  // (örneğin Firebase Functions + Secret Manager) kullanmanız şiddetle tavsiye edilir.
  const apiKey = 'AIzaSyBBDPbrY1JMIGUlXOBMfKLFjR3VZN3X52U'; // <-- GÜVENLİK RİSKİ!
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const prompt = `Title: ${title}\nDescription: ${description}\nExtract 5 key terms from this text that are most relevant to astronomy and space science. Focus on specific astronomical names (like Mars, Jupiter, Hubble) and general space terms. Return only the terms separated by commas in a single line. Example: Mars, Jupiter, Galaxy, Hubble, Supernova`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        throw new Error(`Gemini API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini Raw Response:", data);

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log("Extracted Text:", text);

    return text.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

  } catch (error) {
    console.error("Error extracting keywords with Gemini:", error);
    return []; 
  }
}

/**
 * Anahtar kelimelerle en alakalı 5 APOD görselini bulur (Firestore versiyonu)
 */
export async function findSimilarApodImages(keywords, excludePostId = null) {
  if (!Array.isArray(keywords) || keywords.length === 0) return [];
  const apodCol = collection(db, 'apod_posts');
  const snapshot = await getDocs(apodCol);
  const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const scored = allPosts
    .filter(post => post.id !== excludePostId)
    .map(post => {
      const text = `${post.title || ''} ${post.explanation || ''}`.toLowerCase();
      const matchCount = keywords.filter(kw => text.includes(kw.toLowerCase())).length;
      return { ...post, matchCount };
    })
    .filter(post => post.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 5);

  return scored;
}

/**
 * Anahtar kelimelerle en alakalı 5 APOD görselini bulur (NASA API versiyonu - GÜNCELLENDİ)
 */
export async function findSimilarApodImagesFromApi(keywords, excludeDate = null) {
  // 1. Girdi Kontrolü ve Hazırlık
  if (!Array.isArray(keywords) || keywords.length === 0) {
      console.log("Anahtar kelime yok, benzer görseller bulunamıyor.");
      return [];
  }
  console.log("Benzer görseller aranıyor, anahtar kelimeler:", keywords);
  const lowerKeywords = keywords.map(kw => kw.toLowerCase().trim());

  // 2. Veri Çekme
  let allPosts = [];
  try {
      allPosts = await fetchLastNasaApodsLast6Months();
      if (!allPosts || allPosts.length === 0) {
          console.error("NASA API'den gönderiler alınamadı veya boş geldi.");
          return [];
      }
      console.log(`NASA API'den ${allPosts.length} gönderi alındı.`);
  } catch (error) {
      console.error("NASA API'den gönderi alırken hata:", error);
      return [];
  }

  // 3. Ağırlıklı Arama Terimleri Oluşturma
  const searchTerms = new Map();
  lowerKeywords.forEach(kw => {
      searchTerms.set(kw, (searchTerms.get(kw) || 0) + 10); // Girdi kelimelerine yüksek ağırlık

      for (const [termKey, variations] of Object.entries(ASTRONOMY_TERMS)) {
          // Eğer girdi kelimesi bu terimle ilişkiliyse, varyasyonlarını da ekle
          if (variations.exact.includes(kw) || variations.related.includes(kw)) {
              variations.exact.forEach(v => searchTerms.set(v.toLowerCase(), (searchTerms.get(v.toLowerCase()) || 0) + 15)); // 'Exact' terimlere en yüksek ağırlık
              variations.related.forEach(v => searchTerms.set(v.toLowerCase(), (searchTerms.get(v.toLowerCase()) || 0) + 5)); // 'Related' terimlere orta ağırlık
          }
      }
  });
  console.log("Ağırlıklı Arama Terimleri:", searchTerms);

  // 4. Skorlama
  const scored = allPosts
    .filter(post => post && post.date !== excludeDate) // Geçerli ve hariç tutulmayan gönderiler
    .map(post => {
      const text = `${post.title || ''} ${post.explanation || ''}`.toLowerCase();
      let matchScore = 0;

      // Her gönderi için ağırlıklı arama terimlerini kontrol et
      for (const [term, weight] of searchTerms.entries()) {
          if (text.includes(term)) {
              matchScore += weight; // Eğer terim metinde varsa, ağırlığını skora ekle
          }
      }
      
      // Bonus: Eğer doğrudan girdi kelimelerinden biri varsa ekstra puan
      lowerKeywords.forEach(kw => {
          if (text.includes(kw)) {
              matchScore += 1;
          }
      });

      return { ...post, matchScore };
    })
    .filter(post => post.matchScore > 0) // Skoru 0'dan büyük olanları al
    .sort((a, b) => b.matchScore - a.matchScore) // Skora göre büyükten küçüğe sırala
    .slice(0, 5); // En iyi 5 sonucu al
    
  console.log("Bulunan Benzer Gönderiler:", scored.map(p => ({date: p.date, score: p.matchScore})));
  return scored;
}
