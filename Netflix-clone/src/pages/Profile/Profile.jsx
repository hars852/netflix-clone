import React, { useState, useEffect } from 'react';
import './Profile.css';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { auth, logout } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getWatchlist, getWatchHistory } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import profile_img from '../../assets/profile_img.png';
import { 
  FaUser, 
  FaEnvelope, 
  FaFilm, 
  FaHistory, 
  FaSignOutAlt, 
  FaInstagram, 
  FaTwitter, 
  FaShieldAlt, 
  FaCrown,
  FaCheckCircle 
} from 'react-icons/fa';

const Profile = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    getWatchlist().then((list) => {
      setWatchlistCount(list?.length || 0);
    });

    getWatchHistory().then((hist) => {
      setHistoryCount(hist?.length || 0);
    });

    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Netflix Member');
  const userEmail = user?.email || 'guest@netflix-stream.open';

  return (
    <div className="profile-page-root">
      <Navbar />

      <div className="profile-container">
        {/* Profile Header Card */}
        <div className="profile-hero-card">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              <img src={profile_img} alt="User Avatar" className="profile-avatar-large" />
              <span className="profile-status-dot" title="Active Membership" />
            </div>
            <div className="avatar-info">
              <div className="badge-row">
                <span className="membership-badge">
                  <FaCrown /> Premium Member
                </span>
                <span className="verified-badge">
                  <FaCheckCircle /> Active
                </span>
              </div>
              <h1 className="profile-name">{displayName}</h1>
              <p className="profile-email">
                <FaEnvelope className="inline-icon" /> {userEmail}
              </p>
            </div>
          </div>

          <div className="profile-quick-actions">
            <button className="profile-action-btn primary" onClick={() => navigate('/watchlist')}>
              <FaFilm /> My Watchlist ({watchlistCount})
            </button>
            <button className="profile-action-btn danger" onClick={handleSignOut}>
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats-grid">
          <div className="stat-card" onClick={() => navigate('/watchlist')}>
            <div className="stat-icon-wrap blue">
              <FaFilm />
            </div>
            <div className="stat-text">
              <span className="stat-value">{watchlistCount}</span>
              <span className="stat-label">Saved in Watchlist</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap purple">
              <FaHistory />
            </div>
            <div className="stat-text">
              <span className="stat-value">{historyCount}</span>
              <span className="stat-label">Titles Watched</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap green">
              <FaShieldAlt />
            </div>
            <div className="stat-text">
              <span className="stat-value">1080p Ultra HD</span>
              <span className="stat-label">Streaming Quality</span>
            </div>
          </div>
        </div>

        {/* Account Details & Settings Section */}
        <div className="profile-details-section">
          <h2 className="section-title">Account Information</h2>
          <div className="details-table">
            <div className="detail-row">
              <span className="detail-key">Account Email</span>
              <span className="detail-val">{userEmail}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Plan Tier</span>
              <span className="detail-val">Netflix Premium (Full-Length Free Streaming)</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Architecture</span>
              <span className="detail-val highlight-green">100% Frontend Direct Streaming</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Playback Devices</span>
              <span className="detail-val">Web, Mobile, Tablet, Smart TV Compatible</span>
            </div>
          </div>
        </div>

        {/* Official Social Media Redirect Section */}
        <div className="profile-social-section">
          <h2 className="section-title">Follow Us & Community</h2>
          <p className="social-subtext">
            Stay updated with newest releases, behind-the-scenes, and announcements by following our official social channels:
          </p>

          <div className="social-redirect-cards">
            {/* Instagram Redirect */}
            <a 
              href="https://www.instagram.com/netflix" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-card instagram"
            >
              <div className="social-card-icon instagram-gradient">
                <FaInstagram />
              </div>
              <div className="social-card-text">
                <h3>Instagram</h3>
                <p>@netflix • Photos, reels & updates</p>
              </div>
              <span className="social-arrow">↗</span>
            </a>

            {/* Twitter / X Redirect */}
            <a 
              href="https://twitter.com/netflix" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-card twitter"
            >
              <div className="social-card-icon twitter-black">
                <FaTwitter />
              </div>
              <div className="social-card-text">
                <h3>Twitter / X</h3>
                <p>@netflix • Live news & discussions</p>
              </div>
              <span className="social-arrow">↗</span>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
