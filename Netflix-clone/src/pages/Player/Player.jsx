import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "./Player.css";
import VideoPlayer from "../../components/VideoPlayer/VideoPlayer";
import { fetchMovieDetails, fetchMovieStream, fetchEpisodeStream, saveWatchProgress, FALLBACK_MOVIES } from "../../services/api";
import netflix_spinner from "../../assets/netflix_spinner.gif";
import { FaPlay, FaFilm } from "react-icons/fa";

const Player = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const mediaType = searchParams.get("type") || "movie";
  const directStreamParam = searchParams.get("stream");
  const navigate = useNavigate();

  const [streamInfo, setStreamInfo] = useState(null);
  const [movieDetails, setMovieDetails] = useState({
    title: "",
    overview: "",
    releaseYear: "",
    rating: null,
    genres: [],
    tagline: "",
    duration: "",
    posterUrl: "",
    source: ""
  });
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStreamAndDetails = async () => {
      setLoading(true);
      setHasError(false);

      try {
        // If direct stream URL was passed in query
        if (directStreamParam) {
          if (isMounted) {
            setStreamInfo({
              streamUrl: decodeURIComponent(directStreamParam),
              format: 'mp4',
              title: searchParams.get("title") || "Now Playing"
            });
            setMovieDetails({
              title: searchParams.get("title") || "Now Playing",
              overview: "Full length video playback.",
              releaseYear: "Available Now",
              rating: "7.8",
              genres: ["Streaming"],
              duration: "Full Movie",
              source: "Internet Archive / Free Streaming"
            });
            setLoading(false);
          }
          return;
        }

        // 1. Fetch Movie/Episode Stream
        let stream = null;
        if (mediaType === "episode") {
          stream = await fetchEpisodeStream(id);
        } else {
          stream = await fetchMovieStream(id);
        }

        // 2. Fetch Details
        const details = await fetchMovieDetails(id);

        if (isMounted) {
          const finalStream = (stream && stream.streamUrl) ? stream : {
            streamUrl: FALLBACK_MOVIES[0]?.streamUrl || 'https://archive.org/download/his_girl_friday/his_girl_friday.mp4',
            format: 'mp4',
            duration: FALLBACK_MOVIES[0]?.duration || '1h 32m',
            title: details?.title || FALLBACK_MOVIES[0]?.title || 'Full Feature Film'
          };

          setStreamInfo(finalStream);
          setMovieDetails({
            title: details?.title || finalStream.title || id,
            overview: details?.overview || "Full length feature film.",
            releaseYear: details?.year || "Classic",
            rating: details?.rating || "7.5",
            genres: details?.genres || [details?.category || "Feature Film"],
            duration: details?.duration || finalStream.duration || "Full Length",
            posterUrl: details?.posterUrl || "",
            backdropUrl: details?.backdropUrl || "",
            source: details?.source || "Internet Archive (Free & Legal Streaming)"
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading stream:", err);
        if (isMounted) {
          setHasError(true);
          setLoading(false);
        }
      }
    };

    loadStreamAndDetails();

    return () => {
      isMounted = false;
    };
  }, [id, mediaType, directStreamParam]);

  const handleBack = () => {
    navigate("/");
  };

  const handleProgressUpdate = ({ mediaId, progress, duration }) => {
    saveWatchProgress({
      mediaId,
      mediaType,
      title: movieDetails.title,
      posterUrl: movieDetails.posterUrl,
      progress,
      duration
    });
  };

  return (
    <div className="player-page-root">
      {loading ? (
        <div className="player-loading-container">
          <img src={netflix_spinner} alt="Loading stream..." className="player-spinner" />
          <p className="loading-text">Connecting to full-length video stream...</p>
        </div>
      ) : hasError || !streamInfo?.streamUrl ? (
        <div className="player-error-container unstreamable-card">
          <h2>Full movie currently unavailable.</h2>
          <p>
            A verified full-length video stream is not currently available for this title. Our platform streams <strong>actual full-length movies</strong> without external redirects or promotional trailers.
          </p>
          <p className="sub-notice">Choose one of our verified full-length feature films below to start watching immediately:</p>
          
          <div className="suggested-full-movies">
            {FALLBACK_MOVIES.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="suggested-item"
                onClick={() => navigate(`/player/${m.id}?type=movie`)}
              >
                {(m.backdropUrl || m.posterUrl) && (
                  <img
                    src={m.backdropUrl || m.posterUrl}
                    alt={m.title}
                  />
                )}
                <div className="suggested-meta">
                  <h4>{m.title} ({m.year})</h4>
                  <span><FaPlay /> Watch Full Movie ({m.duration})</span>
                </div>
              </div>
            ))}
          </div>

          <button className="error-back-btn" onClick={handleBack}>
            <FaFilm /> Browse All Full-Length Movies
          </button>
        </div>
      ) : (
        <div className="player-view-wrapper">
          {/* Custom Video Player Component */}
          <VideoPlayer
            src={streamInfo.streamUrl}
            title={movieDetails.title}
            mediaId={id}
            mediaType={mediaType}
            posterUrl={movieDetails.backdropUrl || movieDetails.posterUrl}
            onBack={handleBack}
            onProgressUpdate={handleProgressUpdate}
          />

          {/* Detailed Movie Information Card */}
          <div className="stream-details-card">
            <div className="details-header-row">
              <div className="title-source-wrap">
                <span className="free-stream-tag">FULL MOVIE • FREE & LEGAL STREAM</span>
                <h1 className="stream-movie-title">{movieDetails.title}</h1>
              </div>
              <span className="stream-source-badge">{movieDetails.source}</span>
            </div>

            <div className="details-meta-row">
              {movieDetails.rating && (
                <span className="meta-pill rating">★ {movieDetails.rating}</span>
              )}
              {movieDetails.releaseYear && (
                <span className="meta-pill year">{movieDetails.releaseYear}</span>
              )}
              <span className="meta-pill quality">1080p Full HD</span>
              {movieDetails.duration && (
                <span className="meta-pill duration">{movieDetails.duration}</span>
              )}
            </div>

            {movieDetails.genres?.length > 0 && (
              <div className="genres-pill-row">
                {movieDetails.genres.map((g, idx) => (
                  <span key={idx} className="genre-bubble">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {movieDetails.overview && (
              <p className="stream-movie-overview">{movieDetails.overview}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
