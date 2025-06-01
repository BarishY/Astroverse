// src/utils/formatters.js

/**
 * Bir sayıyı binlik ayraçlarla formatlar.
 * @param {number} number - Formatlanacak sayı.
 * @param {string} locale - Kullanılacak yerel ayar (örn: 'tr-TR', 'en-US').
 * @returns {string} Formatlanmış sayı string'i.
 */
export const formatNumber = (number, locale = 'tr-TR') => {
    if (typeof number !== 'number') {
      return String(number); // Eğer sayı değilse, olduğu gibi döndür
    }
    try {
      return number.toLocaleString(locale);
    } catch (error) {
      console.error("formatNumber hatası:", number, error);
      return String(number); // Hata durumunda orijinal değeri döndür
    }
  };
  
  /**
   * Bir metni belirli bir uzunlukta kısaltır ve sonuna "..." ekler.
   * @param {string} text - Kısaltılacak metin.
   * @param {number} maxLength - İzin verilen maksimum karakter sayısı.
   * @returns {string} Kısaltılmış metin.
   */
  export const truncateText = (text, maxLength = 100) => {
    if (typeof text !== 'string' || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength).trim() + '...';
  };
  
  /**
   * Bir dosya boyutunu okunabilir bir formata (KB, MB, GB) çevirir.
   * @param {number} bytes - Byte cinsinden dosya boyutu.
   * @param {number} decimals - Ondalık basamak sayısı.
   * @returns {string} Formatlanmış dosya boyutu.
   */
  export const formatBytes = (bytes, decimals = 2) => {
    if (typeof bytes !== 'number' || bytes === 0) return '0 Bytes';
  
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
    const i = Math.floor(Math.log(bytes) / Math.log(k));
  
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  /**
   * Bir string'in baş harflerini büyük yapar.
   * (Örn: "merhaba dünya" -> "Merhaba Dünya")
   * @param {string} str - Formatlanacak string.
   * @returns {string} Baş harfleri büyük yapılmış string.
   */
  export const capitalizeWords = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };
  
  // İleride para birimi formatlama, yüzde formatlama gibi fonksiyonlar eklenebilir.
  // export const formatCurrency = (amount, currency = 'TRY', locale = 'tr-TR') => {
  //   try {
  //     return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(amount);
  //   } catch (error) {
  //     console.error("formatCurrency hatası:", amount, error);
  //     return String(amount);
  //   }
  // };
  