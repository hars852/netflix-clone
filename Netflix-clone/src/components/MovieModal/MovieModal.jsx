import React, { useState, useEffect } from 'react';
import './MovieModal.css';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaPlus, FaCheck, FaTimes, FaStar, FaExclamationCircle } from 'react-icons/fa';
import { toggleWatchlist, getWatchlist, fetchMovieStream } from '../../services/api';

const MovieModal = ({ movie, onClose }) => {
  const navigate = useNavigate();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isCheckingStream, setIsCheckingStream] = useState(true);
  const [isStreamAvailable, setIsStreamAvailable] = useState(false);

  useEffect(() => {
    if (!movie) return;

    let isMounted = true;

    // Check if the movie has a verified full-length video file
    const verifyStream = async () => {
      setIsCheckingStream(true);
      if (movie.streamUrl) {
        if (isMounted) {
          setIsStreamAvailable(true);
          setIsCheckingStream(false);
        }
      } else {
        const streamData = await fetchMovieStream(movie.id);
        if (isMounted) {
          setIsStreamAvailable(Boolean(streamData && streamData.isAvailable && streamData.streamUrl));
          setIsCheckingStream(false);
        }
      }
    };

    verifyStream();

    getWatchlist().then((list) => {
      const exists = list.some((item) => String(item.mediaId || item.id) === String(movie.id));
      if (isMounted) {
        setInWatchlist(exists);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [movie]);

  if (!movie) return null;

  const handleWatchNow = () => {
    navigate(`/player/${movie.id}?type=${movie.type || 'movie'}`);
  };

  const handleToggleWatchlist = async () => {
    const res = await toggleWatchlist({
      mediaId: movie.id,
      mediaType: movie.type || 'movie',
      title: movie.title,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      year: movie.year,
      rating: movie.rating
    });
    if (res) {
      setInWatchlist(res.inWatchlist);
    }
  };

  return (
    <div className="movie-modal-backdrop" onClick={onClose}>
      <div className="movie-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <FaTimes />
        </button>

        {/* Hero Backdrop Preview */}
        <div className="modal-banner">
          {(movie.backdropUrl || movie.posterUrl) && (
            <img
              src={movie.backdropUrl || movie.posterUrl}
              alt={movie.title}
              className="modal-banner-img"
            />
          )}
          <div className="modal-banner-gradient" />
          <div className="modal-banner-content">
            <span className="modal-badge">
              {isStreamAvailable ? 'FULL LENGTH STREAM' : 'OPEN MEDIA CATALOG'}
            </span>
            <h1 className="modal-title">{movie.title}</h1>
            <div className="modal-actions-row">
              {isCheckingStream ? (
                <span className="modal-checking-stream">Checking stream availability...</span>
              ) : isStreamAvailable ? (
                <button className="modal-play-btn" onClick={handleWatchNow}>
                  <FaPlay /> Watch Now
                </button>
              ) : (
                <div className="modal-unavailable-banner">
                  <FaExclamationCircle /> Full movie currently unavailable.
                </div>
              )}
              <button
                className={`modal-list-btn ${inWatchlist ? 'active' : ''}`}
                onClick={handleToggleWatchlist}
                title={inWatchlist ? 'Remove from My List' : 'Add to My List'}
              >
                {inWatchlist ? <FaCheck /> : <FaPlus />} {inWatchlist ? 'In My List' : 'My List'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Info Details */}
        <div className="modal-body">
          <div className="modal-meta-row">
            {movie.rating && (
              <span className="modal-rating">
                <FaStar className="star-icon" /> {movie.rating}
              </span>
            )}
            <span className="modal-year">{movie.year || 'Classic'}</span>
            <span className="modal-quality">1080p Full HD</span>
            <span className="modal-duration">{movie.duration || 'Feature Film'}</span>
          </div>

          {movie.genres?.length > 0 && (
            <div className="modal-genres">
              {movie.genres.map((g, idx) => (
                <span key={idx} className="modal-genre-tag">
                  {g}
                </span>
              ))}
            </div>
          )}

          <p className="modal-overview">{movie.overview}</p>

          <div className="modal-source-info">
            <span>Verified Source:</span> {movie.source || 'Internet Archive / Open Access'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
