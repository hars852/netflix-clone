import React, { useEffect, useRef, useState } from 'react';
import './VideoPlayer.css';
import Hls from 'hls.js';
import {
  FaPlay,
  FaPause,
  FaVolumeMute,
  FaVolumeUp,
  FaVolumeDown,
  FaExpand,
  FaCompress,
  FaRedoAlt,
  FaUndoAlt,
  FaStepForward,
  FaStepBackward,
  FaArrowLeft,
  FaCog
} from 'react-icons/fa';
import netflix_spinner from '../../assets/netflix_spinner.gif';

const VideoPlayer = ({
  src,
  title,
  mediaId,
  mediaType = 'movie',
  posterUrl,
  onBack,
  onNextEpisode,
  onPrevEpisode,
  hasNextEpisode = false,
  hasPrevEpisode = false,
  onProgressUpdate
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressTrackRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [resumePrompt, setResumePrompt] = useState(null);

  const controlsTimeoutRef = useRef(null);

  // Initialize Video / HLS Stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setHasError(false);

    let hls = null;
    if (src.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('Fatal HLS error:', data);
            setHasError(true);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      }
    } else {
      video.src = src;
    }

    // Check for saved progress (Resume watching)
    const savedTime = localStorage.getItem(`netflix_progress_${mediaId}`);
    if (savedTime && parseFloat(savedTime) > 15) {
      const timeInSec = parseFloat(savedTime);
      setResumePrompt(timeInSec);
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, mediaId]);

  // Handle auto-resume prompt
  const handleResume = () => {
    if (videoRef.current && resumePrompt) {
      videoRef.current.currentTime = resumePrompt;
      setResumePrompt(null);
      videoRef.current.play().catch(() => {});
    }
  };

  const handleStartOver = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setResumePrompt(null);
      videoRef.current.play().catch(() => {});
    }
  };

  // Play / Pause toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().catch((err) => {
        console.warn('Playback error:', err.message);
      });
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Time & Duration updates
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);

    // Track buffered progress
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const durationVal = video.duration || 1;
      setBuffered((bufferedEnd / durationVal) * 100);
    }

    // Save progress periodically
    if (mediaId && video.currentTime > 5) {
      localStorage.setItem(`netflix_progress_${mediaId}`, video.currentTime);
      if (onProgressUpdate && Math.floor(video.currentTime) % 10 === 0) {
        onProgressUpdate({
          mediaId,
          mediaType,
          progress: video.currentTime,
          duration: video.duration
        });
      }
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      setIsLoading(false);
    }
  };

  // Seek / Scrub timeline
  const handleSeek = (e) => {
    const track = progressTrackRef.current;
    const video = videoRef.current;
    if (!track || !video || !duration) return;

    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = percentage * duration;

    video.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleTimelineHover = (e) => {
    const track = progressTrackRef.current;
    if (!track || !duration) return;

    const rect = track.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverTime(percentage * duration);
    setHoverPosition(hoverX);
  };

  // Volume & Mute
  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRef.current.muted = nextMute;
    if (!nextMute && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Playback speed
  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  // Skip forward & backward (10s)
  const skipTime = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
      }
    }, 2800);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
          e.preventDefault();
          skipTime(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'arrowup':
          e.preventDefault();
          if (videoRef.current) {
            const v = Math.min(1, videoRef.current.volume + 0.1);
            setVolume(v);
            videoRef.current.volume = v;
          }
          break;
        case 'arrowdown':
          e.preventDefault();
          if (videoRef.current) {
            const v = Math.max(0, videoRef.current.volume - 0.1);
            setVolume(v);
            videoRef.current.volume = v;
          }
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted, duration]);

  // Format seconds to hh:mm:ss or mm:ss
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`custom-video-player-root ${isFullscreen ? 'fullscreen' : ''} ${!showControls && isPlaying ? 'hide-cursor' : ''}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="video-element"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        poster={posterUrl}
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="player-overlay-loading">
          <img src={netflix_spinner} alt="Loading..." />
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="player-overlay-error">
          <h3>Playback Error</h3>
          <p>This stream could not be loaded. Please try again or choose another title.</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Resume Watching Prompt */}
      {resumePrompt && (
        <div className="resume-prompt-card">
          <p>Resume watching from <strong>{formatTime(resumePrompt)}</strong>?</p>
          <div className="resume-actions">
            <button className="resume-btn primary" onClick={handleResume}>
              Resume
            </button>
            <button className="resume-btn secondary" onClick={handleStartOver}>
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Player Header with Back button & Title */}
      <div className={`player-top-bar ${showControls ? 'visible' : ''}`}>
        <button className="top-back-btn" onClick={onBack} title="Back to browse">
          <FaArrowLeft />
        </button>
        <span className="top-video-title">{title}</span>
      </div>

      {/* Bottom Control Bar */}
      <div className={`player-controls-container ${showControls ? 'visible' : ''}`}>
        {/* Interactive Timeline Bar */}
        <div
          className="timeline-wrapper"
          ref={progressTrackRef}
          onClick={handleSeek}
          onMouseMove={handleTimelineHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          {hoverTime !== null && (
            <div
              className="timeline-hover-time"
              style={{ left: `${hoverPosition}px` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
          <div className="timeline-track">
            <div className="timeline-buffered" style={{ width: `${buffered}%` }} />
            <div className="timeline-progress" style={{ width: `${progressPercentage}%` }}>
              <div className="timeline-thumb" />
            </div>
          </div>
        </div>

        {/* Action Controls Row */}
        <div className="controls-row">
          <div className="controls-left">
            {/* Play/Pause */}
            <button className="ctrl-btn" onClick={togglePlay} title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>

            {/* Skip -10s */}
            <button className="ctrl-btn" onClick={() => skipTime(-10)} title="Rewind 10s (Left Arrow)">
              <FaUndoAlt />
            </button>

            {/* Skip +10s */}
            <button className="ctrl-btn" onClick={() => skipTime(10)} title="Forward 10s (Right Arrow)">
              <FaRedoAlt />
            </button>

            {/* Previous Episode button (Series mode) */}
            {hasPrevEpisode && (
              <button className="ctrl-btn" onClick={onPrevEpisode} title="Previous Episode">
                <FaStepBackward />
              </button>
            )}

            {/* Next Episode button (Series mode) */}
            {hasNextEpisode && (
              <button className="ctrl-btn" onClick={onNextEpisode} title="Next Episode">
                <FaStepForward />
              </button>
            )}

            {/* Volume Control */}
            <div className="volume-container">
              <button className="ctrl-btn" onClick={toggleMute} title={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
                {isMuted || volume === 0 ? <FaVolumeMute /> : volume < 0.5 ? <FaVolumeDown /> : <FaVolumeUp />}
              </button>
              <input
                type="range"
                className="volume-slider"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
              />
            </div>

            {/* Time Stamp Display */}
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span className="time-divider">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="controls-right">
            {/* Playback Speed Menu */}
            <div className="speed-dropdown-container">
              <button
                className="ctrl-btn speed-btn"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                title="Playback Speed"
              >
                <span>{playbackSpeed}x</span>
              </button>
              {showSpeedMenu && (
                <div className="speed-menu">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <div
                      key={s}
                      className={`speed-option ${playbackSpeed === s ? 'active' : ''}`}
                      onClick={() => changeSpeed(s)}
                    >
                      {s === 1 ? '1x (Normal)' : `${s}x`}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button className="ctrl-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
