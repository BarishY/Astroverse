import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';

export const useApodData = () => {
  const [apodData, setApodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchApodData = async (date = null) => {
    try {
      setLoading(true);
      setError(null);

      const apiKey = 'DEMO_KEY'; // NASA API anahtarınızı buraya ekleyin
      const baseUrl = 'https://api.nasa.gov/planetary/apod';
      
      let url;
      if (date) {
        url = `${baseUrl}?api_key=${apiKey}&date=${date}`;
      } else {
        const endDate = format(new Date(), 'yyyy-MM-dd');
        const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        url = `${baseUrl}?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'API isteği başarısız oldu');
      }

      // API'den gelen veriyi düzenle
      const formattedData = Array.isArray(data) ? data : [data];
      
      // Sadece resimleri filtrele (video içermeyen)
      const filteredData = formattedData.filter(item => 
        item.media_type === 'image' && 
        !item.url.includes('youtube.com') && 
        !item.url.includes('vimeo.com')
      );

      // Tarihe göre sırala (en yeni en üstte)
      const sortedData = filteredData.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );

      // En fazla 25 resim göster
      const limitedData = sortedData.slice(0, 25);

      setApodData(limitedData);
    } catch (err) {
      setError(err.message);
      console.error('API Hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApodData();
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    fetchApodData(date);
  };

  return {
    apodData,
    loading,
    error,
    selectedDate,
    handleDateSelect,
    fetchApodData
  };
}; 