import React, { useEffect, useRef, useState } from 'react';
import './TitleCards.css';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FALLBACK_TMDB_NOW_PLAYING } from '../../services/tmdbService';

const TMDB_DEFAULT_API_KEY = 'ce9cc71711271b44618edbd7b40c305d';
const TMDB_DEFAULT_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjZTljYzcxNzExMjcxYjQ0NjE4ZWRiZDdiNDBjMzA1ZCIsIm5iZiI6MTc1MjM4MTgzOS43MjEsInN1YiI6IjY4NzMzOThmMjc1YmI0NmVlZTZlYTI5ZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.kLmsOveIU4wc-N-K1zgUBRU1InV5mSh2JGQhvL6TY-o';

const TitleCards = ({ title, category, type = "movie" }) => {
  const cacheKey = `tmdb_cards_${type}_${category || 'default'}`;

  // Read immediately from cache so on refresh the real TMDB data shows instantly
  const getCachedData = () => {
    try {
      const saved = sessionStorage.getItem(cacheKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [apiData, setApiData] = useState(() => getCachedData());
  const [loading, setLoading] = useState(() => getCachedData().length === 0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const cardsRef = useRef();

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const token = import.meta.env.VITE_TMDB_TOKEN || TMDB_DEFAULT_TOKEN;
  const apiKey = import.meta.env.VITE_TMDB_API_KEY || TMDB_DEFAULT_API_KEY;
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`
    }
  };

  const checkScrollBounds = () => {
    if (cardsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = cardsRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const handleScroll = (direction) => {
    if (cardsRef.current) {
      const scrollDistance = cardsRef.current.clientWidth * 0.75;
      cardsRef.current.scrollBy({
        left: direction === 'left' ? -scrollDistance : scrollDistance,
        behavior: 'smooth'
      });
      setTimeout(checkScrollBounds, 350);
    }
  };

  // Drag to scroll handlers
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - cardsRef.current.offsetLeft;
    scrollLeftRef.current = cardsRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const x = e.pageX - cardsRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(walk) > 6) {
      hasMovedRef.current = true;
    }
    cardsRef.current.scrollLeft = scrollLeftRef.current - walk;
    checkScrollBounds();
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const endpoint = type === 'tv'
      ? `https://api.themoviedb.org/3/tv/${category ? category : 'popular'}?language=en-US&page=1&api_key=${apiKey}`
      : `https://api.themoviedb.org/3/movie/${category ? category : 'now_playing'}?language=en-US&page=1&api_key=${apiKey}`;

    fetch(endpoint, options)
      .then((res) => res.json())
      .then((res) => {
        if (res.results && res.results.length > 0) {
          // Frontend filter: keep only movies with valid poster or backdrop image
          let valid = res.results.filter((m) => m && (m.backdrop_path || m.poster_path));

          // For now_playing: 1 is show in 2 and 2 is show in 1
          if (category === 'now_playing' && valid.length >= 2) {
            const temp = valid[0];
            valid[0] = valid[1];
            valid[1] = temp;
          }

          if (valid.length > 0) {
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(valid));
            } catch {}
            setApiData(valid);
          }
        } else if (apiData.length === 0) {
          setApiData(FALLBACK_TMDB_NOW_PLAYING);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('TMDB fetch failed for carousel, using fallback:', err.message);
        if (apiData.length === 0) {
          setApiData(FALLBACK_TMDB_NOW_PLAYING);
        }
        setLoading(false);
      });
  }, [category, type, cacheKey, apiKey]);

  useEffect(() => {
    checkScrollBounds();
  }, [apiData]);

  return (
    <div className='title-cards'>
      <h2>{title ? title : 'Popular on Netflix'}</h2>
      <div className="carousel-container">
        {canScrollLeft && (
          <button
            className="slider-arrow slider-arrow-left"
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
          >
            <FaChevronLeft />
          </button>
        )}

        {loading && apiData.length === 0 ? (
          <div className="card-list">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="card-skeleton" />
            ))}
          </div>
        ) : (
          <div
            className='card-list'
            ref={cardsRef}
            onScroll={checkScrollBounds}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            {apiData.map((card, index) => {
              const cardTitle = card.title || card.name || card.original_title || card.original_name || 'Movie';
              const cardId = card.id || `card_${index}`;
              const cardImg = card?.backdrop_path
                ? `https://image.tmdb.org/t/p/w500${card.backdrop_path}`
                : card?.poster_path
                ? `https://image.tmdb.org/t/p/w500${card.poster_path}`
                : '';

              return (
                <Link
                  to={`/player/${cardId}?type=${type}`}
                  className='card'
                  key={cardId}
                  title={cardTitle}
                  onClick={(e) => {
                    if (hasMovedRef.current) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="card-image-wrap">
                    {cardImg ? (
                      <img
                        src={cardImg}
                        alt={cardTitle}
                        loading="lazy"
                        draggable="false"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
                        }}
                      />
                    ) : (
                      <div className="card-skeleton" style={{ width: '100%', height: '100%' }} />
                    )}
                    <div className="card-gradient"></div>
                  </div>
                  <p className="card-title">{cardTitle}</p>
                </Link>
              );
            })}
          </div>
        )}

        {canScrollRight && !loading && (
          <button
            className="slider-arrow slider-arrow-right"
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
          >
            <FaChevronRight />
          </button>
        )}
      </div>
    </div>
  );
};

export default TitleCards;
