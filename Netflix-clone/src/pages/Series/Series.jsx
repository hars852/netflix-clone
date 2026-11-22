import React, { useEffect, useState } from 'react';
import './Series.css';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { fetchSeries, fetchSeriesSeasons } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaTv } from 'react-icons/fa';
import netflix_spinner from '../../assets/netflix_spinner.gif';

const Series = () => {
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSeries().then((list) => {
      setSeriesList(list);
      if (list.length > 0) {
        setSelectedSeries(list[0]);
        setSeasons(list[0].seasons || []);
      }
      setLoading(false);
    });
  }, []);

  const handleSelectSeries = (s) => {
    setSelectedSeries(s);
    setSeasons(s.seasons || []);
  };

  const handlePlayEpisode = (ep) => {
    // Navigate to built-in player with episode stream
    const streamUrl = `https://archive.org/download/${ep.identifier}/${ep.fileName}`;
    navigate(`/player/${ep.identifier}?type=episode&stream=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(`${selectedSeries?.title} - Ep ${ep.episodeNumber}: ${ep.title}`)}`);
  };

  return (
    <div className="series-page-container">
      <Navbar />

      <div className="series-hero-header">
        <h1>
          <FaTv className="series-header-icon" /> Web Series & Classic Television
        </h1>
        <p>Explore complete classic series with authorized full-length episodes.</p>
      </div>

      {loading ? (
        <div className="series-loading">
          <img src={netflix_spinner} alt="Loading series..." />
        </div>
      ) : (
        <div className="series-content-layout">
          {/* Series Selection Cards Row */}
          <div className="series-cards-row">
            {seriesList.map((s) => (
              <div
                key={s.id}
                className={`series-card-item ${selectedSeries?.id === s.id ? 'active' : ''}`}
                onClick={() => handleSelectSeries(s)}
              >
                {s.posterUrl && (
                  <img
                    src={s.posterUrl}
                    alt={s.title}
                  />
                )}
                <div className="series-card-meta">
                  <h3>{s.title}</h3>
                  <div className="series-tag-row">
                    <span>{s.year}</span>
                    <span>{s.genre}</span>
                    <span>★ {s.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Series Detail & Episodes List */}
          {selectedSeries && (
            <div className="selected-series-details">
              <div className="series-info-banner">
                <h2>{selectedSeries.title}</h2>
                <p className="series-overview">{selectedSeries.overview}</p>
                <div className="series-season-count">
                  {selectedSeries.totalSeasons} Season{selectedSeries.totalSeasons > 1 ? 's' : ''} • {selectedSeries.totalEpisodes} Verified Episodes Available
                </div>
              </div>

              {/* Seasons & Episodes Breakdown */}
              <div className="seasons-container">
                {seasons.map((season) => (
                  <div key={season.seasonNumber} className="season-block">
                    <h3 className="season-title">Season {season.seasonNumber}</h3>
                    <div className="episodes-grid">
                      {season.episodes.map((ep) => (
                        <div key={ep.episodeNumber} className="episode-card" onClick={() => handlePlayEpisode(ep)}>
                          <div className="episode-thumb-wrap">
                            <img
                              src={`https://archive.org/services/img/${ep.identifier}`}
                              alt={ep.title}
                              onError={(e) => {
                                e.target.src = selectedSeries.posterUrl;
                              }}
                            />
                            <div className="episode-play-overlay">
                              <FaPlay className="play-icon" />
                            </div>
                            <span className="episode-duration">{ep.duration}</span>
                          </div>
                          <div className="episode-meta">
                            <span className="episode-number">Episode {ep.episodeNumber}</span>
                            <h4 className="episode-title">{ep.title}</h4>
                            <p className="episode-overview">{ep.overview}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Series;
