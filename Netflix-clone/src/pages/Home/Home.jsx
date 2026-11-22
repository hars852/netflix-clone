import React, { useEffect, useState } from 'react';
import './Home.css';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import MovieModal from '../../components/MovieModal/MovieModal';
import TitleCards from '../../components/TitleCards/TitleCards';
import { fetchMovies } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaInfoCircle, FaStar, FaFilm } from 'react-icons/fa';
import netflix_spinner from '../../assets/netflix_spinner.gif';

const CATEGORIES = ['All', 'Action', 'Comedy', 'Horror', 'Thriller', 'Romance'];

// Read cached TMDB movies synchronously so on refresh there is zero delay or random image flash
const getCachedHomeMovies = () => {
  try {
    const saved = sessionStorage.getItem('tmdb_now_playing_movies');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const Home = () => {
  const cachedInitial = getCachedHomeMovies();
  const [allMovies, setAllMovies] = useState(cachedInitial);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredMovies, setFilteredMovies] = useState(cachedInitial);
  const [heroMovie, setHeroMovie] = useState(cachedInitial.length > 0 ? cachedInitial[0] : null);
  const [modalMovie, setModalMovie] = useState(null);
  const [loading, setLoading] = useState(cachedInitial.length === 0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovies().then((movies) => {
      // Filter out any movies without title or metadata
      const validMovies = (movies || []).filter((m) => m && (m.title || m.name));
      if (validMovies.length > 0) {
        try {
          sessionStorage.setItem('tmdb_now_playing_movies', JSON.stringify(validMovies));
        } catch {}
        setAllMovies(validMovies);
        setHeroMovie(validMovies[0]);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredMovies(allMovies);
    } else {
      setFilteredMovies(
        allMovies.filter(
          (m) =>
            m.category?.toLowerCase() === selectedCategory.toLowerCase() ||
            m.genres?.some((g) => g.toLowerCase().includes(selectedCategory.toLowerCase()))
        )
      );
    }
  }, [selectedCategory, allMovies]);

  const handleWatchNow = (movie) => {
    if (movie?.id) {
      navigate(`/player/${movie.id}?type=movie`);
    }
  };

  return (
    <div className="home-root">
      <Navbar />

      {/* Hero Banner Section */}
      <div className="hero-banner-container">
        {heroMovie?.backdropUrl ? (
          <img
            src={heroMovie.backdropUrl}
            alt={heroMovie?.title || 'Featured Film'}
            className="hero-background-img"
            onError={(e) => {
              if (heroMovie.posterUrl && e.target.src !== heroMovie.posterUrl) {
                e.target.src = heroMovie.posterUrl;
              } else {
                e.target.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80';
              }
            }}
          />
        ) : (
          <div className="hero-placeholder-shimmer" />
        )}
        <div className="hero-vignette-overlay" />
        {heroMovie && (
          <div className="hero-info-content">
            <span className="hero-badge">
              <FaFilm /> FULL-LENGTH FEATURE FILM
            </span>
            <h1 className="hero-movie-title">{heroMovie.title}</h1>
            <p className="hero-movie-desc">{heroMovie.overview}</p>
            <div className="hero-cta-buttons">
              <button
                className="hero-btn primary-watch-btn"
                onClick={() => handleWatchNow(heroMovie)}
              >
                <FaPlay /> Watch Now
              </button>
              <button
                className="hero-btn secondary-info-btn"
                onClick={() => setModalMovie(heroMovie)}
              >
                <FaInfoCircle /> More Info
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="category-filter-bar" id="movies-section">
        <span className="filter-label">Explore by Genre:</span>
        <div className="pills-scroll-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`genre-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Movie Library Grid */}
      <div className="movies-grid-section">
        <h2 className="section-heading">
          {selectedCategory === 'All' ? 'Full-Length Free Movies' : `${selectedCategory} Movies`}
        </h2>

        {loading && filteredMovies.length === 0 ? (
          <div className="home-loading">
            <img src={netflix_spinner} alt="Loading movies..." />
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="no-movies-found">
            <p>No titles found in this category.</p>
          </div>
        ) : (
          <div className="stream-cards-grid">
            {filteredMovies.map((movie, index) => {
              const movieImg = movie.backdropUrl || movie.posterUrl;
              return (
                <div
                  key={movie.id || index}
                  className="stream-movie-card"
                  onClick={() => setModalMovie(movie)}
                >
                  <div className="card-thumb-wrapper">
                    {movieImg && (
                      <img
                        src={movieImg}
                        alt={movie.title || movie.name}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
                        }}
                      />
                    )}
                    <div className="card-hover-overlay">
                      <button
                        className="card-quick-play-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWatchNow(movie);
                        }}
                        title="Watch Now"
                      >
                        <FaPlay />
                      </button>
                      <span className="card-duration-tag">{movie.duration || 'Full Movie'}</span>
                    </div>
                    <div className="card-bottom-gradient" />
                  </div>
                  <div className="card-text-meta">
                    <h3>{movie.title || movie.name}</h3>
                    <div className="card-meta-line">
                      <span className="meta-year">{movie.year || 'Classic'}</span>
                      {movie.rating && (
                        <span className="meta-star">
                          <FaStar /> {movie.rating}
                        </span>
                      )}
                      <span className="meta-stream-badge">Free</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Carousels */}
      <div className="home-carousels-section" style={{ padding: '0 6% 40px' }}>
        <TitleCards title="Blockbuster Movies" category="top_rated" />
        <TitleCards title="Only on Netflix" category="popular" />
        <TitleCards title="Upcoming Releases" category="upcoming" />
        <TitleCards title="Top Picks for You" category="now_playing" />
      </div>

      {/* Movie Details Modal */}
      {modalMovie && (
        <MovieModal movie={modalMovie} onClose={() => setModalMovie(null)} />
      )}

      <Footer />
    </div>
  );
};

export default Home;
