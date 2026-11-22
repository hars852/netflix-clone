import React, { useEffect, useRef, useState } from "react";
import "./Navbar.css";
import logo from "../../assets/logo.png";
import search_icon from "../../assets/search_icon.svg";
import bell_icon from "../../assets/bell_icon.svg";
import profile_img from "../../assets/profile_img.png";
import caret_icon from "../../assets/caret_icon.svg";
import { auth, logout } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { searchMovies } from "../../services/api";
import { FaSearch, FaTimes, FaPlay, FaUser, FaBookmark, FaSignOutAlt } from "react-icons/fa";

const Navbar = () => {
  const navRef = useRef();
  const searchInputRef = useRef();
  const profileRef = useRef();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (curr) => setUser(curr));
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY >= 80) {
        navRef.current?.classList.add("nav-dark");
      } else {
        navRef.current?.classList.remove("nav-dark");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Live search debounced query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchMovies(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectMovie = (movie) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/player/${movie.id}?type=movie`);
  };

  return (
    <div ref={navRef} className="navbar">
      <div className="navbar-left">
        <Link to="/">
          <img src={logo} alt="Netflix Logo" className="brand-logo" />
        </Link>
        <ul>
          <li>
            <Link to="/" className="nav-link">Home</Link>
          </li>
          <li>
            <Link to="/series" className="nav-link">Web Series</Link>
          </li>
          <li>
            <span
              className="nav-link"
              onClick={() => {
                if (window.location.pathname !== '/') {
                  navigate('/');
                } else {
                  document.getElementById('movies-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Movies
            </span>
          </li>
          <li>
            <Link to="/watchlist" className="nav-link">My List</Link>
          </li>
        </ul>
      </div>

      <div className="navbar-right">
        {/* Interactive Search Bar */}
        <div className={`nav-search-wrapper ${isSearchOpen ? 'active' : ''}`}>
          <button
            className="search-toggle-btn"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (!isSearchOpen) {
                setTimeout(() => searchInputRef.current?.focus(), 150);
              } else {
                setSearchQuery("");
                setSearchResults([]);
              }
            }}
            title="Search movies by title"
          >
            {isSearchOpen ? <FaTimes /> : <FaSearch />}
          </button>

          {isSearchOpen && (
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Titles, people, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nav-search-input"
            />
          )}

          {/* Instant Search Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="search-dropdown-results">
              <div className="dropdown-header">Verified Full-Length Movies</div>
              {searchResults.slice(0, 6).map((movie) => (
                <div
                  key={movie.id}
                  className="search-result-item"
                  onClick={() => handleSelectMovie(movie)}
                >
                  <img
                    src={movie.backdropUrl || movie.posterUrl}
                    alt={movie.title}
                    className="result-thumb"
                  />
                  <div className="result-info">
                    <h4>{movie.title}</h4>
                    <p>{movie.year} • {movie.genres?.[0] || 'Movie'} • ★ {movie.rating || '7.5'}</p>
                  </div>
                  <FaPlay className="play-hint-icon" />
                </div>
              ))}
            </div>
          )}
        </div>

        <img src={bell_icon} alt="Notifications" className="icons" />

        <div 
          ref={profileRef}
          className={`navbar-profile ${isProfileOpen ? 'open' : ''}`}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <img src={profile_img} alt="Profile" className="profile" />
          <img src={caret_icon} alt="Caret" className={`caret-arrow ${isProfileOpen ? 'rotated' : ''}`} />
          <div className={`dropdown ${isProfileOpen ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="dropdown-user-header">
              <img src={profile_img} alt="Avatar" className="dropdown-avatar" />
              <div className="dropdown-user-text">
                <span className="dropdown-user-name">
                  {user?.displayName || (user?.email ? user.email.split('@')[0] : 'Netflix Member')}
                </span>
                <span className="dropdown-user-email">{user?.email || 'guest@netflix'}</span>
              </div>
            </div>

            <div className="dropdown-menu-list">
              <div 
                className="dropdown-menu-item"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/profile');
                }}
              >
                <FaUser className="dropdown-item-icon" />
                <span>My Profile</span>
              </div>

              <div 
                className="dropdown-menu-item"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/watchlist');
                }}
              >
                <FaBookmark className="dropdown-item-icon" />
                <span>My List</span>
              </div>
            </div>

            <div className="dropdown-divider" />

            <div 
              className="dropdown-menu-item signout-item"
              onClick={async () => {
                setIsProfileOpen(false);
                await logout();
                navigate('/login');
              }}
            >
              <FaSignOutAlt className="dropdown-item-icon" />
              <span>Sign Out of Netflix</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
