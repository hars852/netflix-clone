import React, { useEffect, useState } from 'react';
import './Watchlist.css';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { getWatchlist } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaBookmark } from 'react-icons/fa';
import netflix_spinner from '../../assets/netflix_spinner.gif';

const Watchlist = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getWatchlist().then((items) => {
      setList(items);
      setLoading(false);
    });
  }, []);

  return (
    <div className="watchlist-page-container">
      <Navbar />

      <div className="watchlist-header">
        <h1>
          <FaBookmark className="header-icon" /> My List
        </h1>
        <p>Your saved full-length movies and series ready for streaming.</p>
      </div>

      {loading ? (
        <div className="watchlist-loading">
          <img src={netflix_spinner} alt="Loading list..." />
        </div>
      ) : list.length === 0 ? (
        <div className="watchlist-empty">
          <h2>Your list is empty</h2>
          <p>Explore our library of free full-length movies and series, and add them to your list!</p>
          <button onClick={() => navigate('/')}>Browse Movies</button>
        </div>
      ) : (
        <div className="watchlist-grid">
          {list.map((item) => (
            <div
              key={item.mediaId}
              className="watchlist-card"
              onClick={() => navigate(`/player/${item.mediaId}?type=${item.mediaType || 'movie'}`)}
            >
              <div className="watchlist-thumb-wrap">
                {(item.backdropUrl || item.posterUrl) && (
                  <img
                    src={item.backdropUrl || item.posterUrl}
                    alt={item.title}
                  />
                )}
                <div className="watchlist-play-btn">
                  <FaPlay />
                </div>
              </div>
              <div className="watchlist-card-meta">
                <h3>{item.title}</h3>
                <div className="watchlist-sub-row">
                  <span>{item.year || 'Feature'}</span>
                  {item.rating && <span>★ {item.rating}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Watchlist;
