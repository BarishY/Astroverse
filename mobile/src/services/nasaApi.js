// src/services/nasaApi.js
import axios from 'axios';
// Tarih formatlama için date-fns kütüphanesini yüklemeniz gerekebilir: npm install date-fns
import { format, subDays, isAfter, isBefore } from 'date-fns';

const API_KEY = 'F0y2EDV7Zo3jIKnnzxaN4PYb8FK4Lnp6rhOQ1d5Q'; // Yeni NASA API Anahtarı
const BASE_URL = 'https://api.nasa.gov/planetary/apod';

// NASA API'nin başlangıç tarihi
const NASA_API_START_DATE = new Date('1995-06-16');

// Son gün her zaman bugün olacak
const getEndDate = () => new Date();

/**
 * Son 30 günün APOD verilerini getirir.
 * @returns {Promise<Array>} APOD verileri dizisi veya hata durumunda boş dizi.
 */
export const fetchApodLast30Days = async () => {
    try {
        // Bugünden geriye doğru 30 günün tarihlerini oluştur
        const today = getEndDate();
        const dates = [];
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dates.push(format(d, 'yyyy-MM-dd'));
        }

        const startDate = dates[dates.length - 1];
        const endDate = dates[0];

        console.log('NASA API Tarih Aralığı:', {
            startDate,
            endDate,
            totalDays: dates.length,
            currentTime: today.toISOString()
        });

        const response = await axios.get(BASE_URL, {
            params: {
                api_key: API_KEY,
                start_date: startDate,
                end_date: endDate
            }
        });

        if (!response.data) {
            console.error('NASA API boş yanıt döndü');
            return [];
        }

        // API eski tarihten yeniye sıralı döndürür, biz yeni tarihler en başta olsun diye ters çeviriyoruz
        const data = Array.isArray(response.data) ? response.data : [response.data];
        return data.reverse();
    } catch (error) {
        console.error("NASA APOD API Hatası:", error.response ? error.response.data : error.message);
        return [];
    }
};

/**
 * Belirli bir tarihe ait APOD verisini getirir.
 * @param {string} date - 'YYYY-MM-DD' formatında tarih.
 * @returns {Promise<Object|null>} APOD verisi veya hata durumunda null.
 */
export const fetchApodByDate = async (date) => {
    if (!date) {
        console.error("fetchApodByDate: Tarih parametresi gerekli.");
        return null;
    }

    try {
        const response = await axios.get(BASE_URL, {
            params: {
                api_key: API_KEY,
                date: date
            }
        });
        return response.data;
    } catch (error) {
        console.error(`NASA APOD API Hatası (${date}):`, error.response ? error.response.data : error.message);
        return null;
    }
};

export async function fetchLastNasaApodsLast6Months() {
  const apiKey = API_KEY;
  let endDate = new Date();
  let startDate = subDays(endDate, 182); // 6 ay ≈ 182 gün

  // Tarihleri NASA API'nin desteklediği aralıkta olacak şekilde ayarla
  if (isAfter(endDate, getEndDate())) {
    endDate = getEndDate();
    startDate = subDays(endDate, 182);
  }
  if (isBefore(startDate, NASA_API_START_DATE)) {
    startDate = NASA_API_START_DATE;
  }

  console.log('NASA API Tarih Aralığı:', {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd')
  });

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        api_key: apiKey,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd')
      }
    });

    if (!response.data) {
      console.error('NASA API boş yanıt döndü');
      return [];
    }

    // API bazen tek bir obje dönebilir (eğer tarih aralığı çok darsa veya tek bir günse)
    const data = Array.isArray(response.data) ? response.data : [response.data];
    
    // Verileri en yeniden en eskiye sırala
    return data.reverse();
  } catch (error) {
    console.error('NASA API Hatası (fetchLastNasaApodsLast6Months):', error.response ? error.response.data : error.message);
    return [];
  }
}

/**
 * Son 2 günün NASA APOD verilerini getirir
 */
export const fetchLastNasaApodsLast2Days = async () => {
    try {
        // Bugünden geriye doğru 2 günün tarihlerini oluştur
        const today = getEndDate();
        const dates = [];
        for (let i = 0; i < 2; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dates.push(format(d, 'yyyy-MM-dd'));
        }

        const startDate = dates[dates.length - 1];
        const endDate = dates[0];

        console.log('NASA API Son 2 Gün İstek Detayları:', {
            startDate,
            endDate,
            dates,
            currentTime: today.toISOString()
        });

        const response = await axios.get(BASE_URL, {
            params: {
                api_key: API_KEY,
                start_date: startDate,
                end_date: endDate
            }
        });

        if (!response.data) {
            console.error('NASA API boş yanıt döndü');
            return [];
        }

        // API eski tarihten yeniye sıralı döndürür, biz yeni tarihler en başta olsun diye ters çeviriyoruz
        const data = Array.isArray(response.data) ? response.data : [response.data];
        return data.reverse();
    } catch (error) {
        console.error('NASA API Hatası:', error.response ? error.response.data : error.message);
        return [];
    }
};
