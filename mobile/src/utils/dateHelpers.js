// src/utils/dateHelpers.js
import { format as formatDateFns, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale'; // Türkçe dil desteği

/**
 * Verilen bir tarihi "X zaman önce" (örneğin "3 gün önce", "2 saat önce") formatına çevirir.
 * @param {Date | string | number} date - Tarih nesnesi, ISO string veya timestamp.
 * @returns {string} Biçimlendirilmiş zaman farkı.
 */
export const timeAgo = (date) => {
  if (!date) return '';
  try {
    const dateToFormat = typeof date === 'string' ? parseISO(date) : date;
    // addSuffix: true yerine, formatDistanceToNowStrict daha sade bir çıktı verir (örn: "3 gün")
    // İstersen "önce" eklemek için manuel olarak birleştirme yapabilirsin.
    return formatDistanceToNowStrict(dateToFormat, { locale: tr, addSuffix: true });
  } catch (error) {
    console.error("timeAgo formatlama hatası:", date, error);
    return 'bir süre önce'; // Hata durumunda genel bir ifade
  }
};

/**
 * Verilen bir tarihi belirli bir formata çevirir.
 * @param {Date | string | number} date - Tarih nesnesi, ISO string veya timestamp.
 * @param {string} formatString - İstenen format (örn: 'dd MMMM yyyy, HH:mm', 'dd.MM.yyyy').
 * @returns {string} Biçimlendirilmiş tarih.
 */
export const formatCustomDate = (date, formatString = 'dd MMMM yyyy') => {
  if (!date) return '';
  try {
    const dateToFormat = typeof date === 'string' ? parseISO(date) : date;
    return formatDateFns(dateToFormat, formatString, { locale: tr });
  } catch (error) {
    console.error("formatCustomDate formatlama hatası:", date, error);
    return 'Geçersiz Tarih';
  }
};

/**
 * Firebase Timestamp nesnesini Date nesnesine çevirir.
 * @param {object} timestamp - Firebase Timestamp (seconds, nanoseconds).
 * @returns {Date | null} Date nesnesi veya null.
 */
export const timestampToDate = (timestamp) => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  // Eğer timestamp zaten bir Date nesnesiyse veya geçerli bir tarih string'i ise
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    try {
      const parsedDate = new Date(timestamp);
      if (!isNaN(parsedDate.getTime())) { // Geçerli bir tarih mi kontrol et
        return parsedDate;
      }
    } catch (e) { /* ignore */ }
  }
  console.warn("timestampToDate: Geçersiz timestamp formatı", timestamp);
  return null;
};

/**
 * İki tarih arasındaki farkı okunabilir bir formatta döndürür.
 * @param {Date | string | number} dateLeft
 * @param {Date | string | number} dateRight
 * @returns {string}
 */
export const formatDistance = (dateLeft, dateRight = new Date()) => {
    if (!dateLeft) return '';
    try {
        const dLeft = typeof dateLeft === 'string' ? parseISO(dateLeft) : dateLeft;
        const dRight = typeof dateRight === 'string' ? parseISO(dateRight) : dateRight;
        return formatDistanceToNowStrict(dLeft, { locale: tr, unit: 'day', addSuffix: false }) + ' önce'; // Örnek: "3 gün önce"
    } catch (error) {
        console.error("formatDistance hatası:", error);
        return '';
    }
};
