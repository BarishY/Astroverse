import axios from "axios";
const NASA_API_KEY = "F0y2EDV7Zo3jIKnnzxaN4PYb8FK4Lnp6rhOQ1d5Q";

export const fetchNasaImages = async () => {
  // Bugünden geriye doğru 30 günün tarihlerini oluştur
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const startDate = dates[dates.length - 1];
  const endDate = dates[0];
  // APOD API'de date aralığı ile çek
  const res = await axios.get(
    `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`
  );
  // API eski tarihten yeniye sıralı döndürür, biz yeni tarihler en başta olsun diye ters çeviriyoruz
  return res.data.reverse();
}; 