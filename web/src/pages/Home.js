import React, { useState, useEffect } from 'react';
import '../styles/Home.css';

const Home = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNasaVideo = async () => {
      try {
        const response = await fetch(
          'https://api.nasa.gov/planetary/apod?api_key=6dy31IukKHxzwGASrJeuX1tlSffXxmxvnP9aczie&count=1'
        );
        const data = await response.json();
        
        // Eğer gelen veri video ise
        if (data[0].media_type === 'video') {
          setVideoUrl(data[0].url);
        } else {
          // Video yoksa varsayılan bir video kullan
          setVideoUrl('https://images-assets.nasa.gov/video/iss064e027527/iss064e027527~orig.mp4');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching NASA video:', error);
        setLoading(false);
      }
    };

    fetchNasaVideo();
  }, []);

  return (
    <div className="title-container">
      {!loading && (
        <video
          className="background-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}
      <div className="overlay"></div>
      <div className="box-of-star1">
        <div className="star star-position1"></div>
        <div className="star star-position2"></div>
        <div className="star star-position3"></div>
        <div className="star star-position4"></div>
        <div className="star star-position5"></div>
        <div className="star star-position6"></div>
        <div className="star star-position7"></div>
      </div>
      <div className="box-of-star2">
        <div className="star star-position1"></div>
        <div className="star star-position2"></div>
        <div className="star star-position3"></div>
        <div className="star star-position4"></div>
        <div className="star star-position5"></div>
        <div className="star star-position6"></div>
        <div className="star star-position7"></div>
      </div>
      <div className="box-of-star3">
        <div className="star star-position1"></div>
        <div className="star star-position2"></div>
        <div className="star star-position3"></div>
        <div className="star star-position4"></div>
        <div className="star star-position5"></div>
        <div className="star star-position6"></div>
        <div className="star star-position7"></div>
      </div>
      <div className="box-of-star4">
        <div className="star star-position1"></div>
        <div className="star star-position2"></div>
        <div className="star star-position3"></div>
        <div className="star star-position4"></div>
        <div className="star star-position5"></div>
        <div className="star star-position6"></div>
        <div className="star star-position7"></div>
      </div>
      <h1 className="neon-title">ASTROVERSE</h1>
      <div data-js="astro" className="astronaut">
        <div className="head"></div>
        <div className="arm arm-left"></div>
        <div className="arm arm-right"></div>
        <div className="body">
          <div className="panel"></div>
        </div>
        <div className="leg leg-left"></div>
        <div className="leg leg-right"></div>
        <div className="schoolbag"></div>
      </div>
    </div>
  );
};

export default Home; 