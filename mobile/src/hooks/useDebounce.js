// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Bir değeri belirli bir gecikmeyle debounce (gecikmeli olarak güncelleme) etmek için custom hook.
 * @param {*} value - Debounce edilecek değer.
 * @param {number} delay - Milisaniye cinsinden gecikme süresi.
 * @returns {*} Debounce edilmiş değer.
 */
function useDebounce(value, delay) {
  // Debounce edilmiş değeri tutacak state
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // 'value' veya 'delay' değiştiğinde bir zamanlayıcı ayarla
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Eğer 'value' veya 'delay' tekrar değişirse (veya component unmount olursa)
      // bu zamanlayıcıyı temizle. Bu, gecikme süresi dolmadan önceki
      // setDebouncedValue çağrılarını engeller.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Sadece value veya delay değiştiğinde bu effect'i tekrar çalıştır
  );

  return debouncedValue;
}

export default useDebounce;
