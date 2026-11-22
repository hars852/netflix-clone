import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Player from './pages/Player/Player';
import Series from './pages/Series/Series';
import Watchlist from './pages/Watchlist/Watchlist';
import Profile from './pages/Profile/Profile';
import FlyerPage from './pages/Flyer/flyer.jsx';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import netflix_spinner from './assets/netflix_spinner.gif';

// Error Boundary to prevent any blank page crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#141414',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Helvetica, Arial, sans-serif'
        }}>
          <h2 style={{ fontSize: '28px', marginBottom: '12px', color: '#e50914' }}>
            Netflix Streaming Engine
          </h2>
          <p style={{ color: '#bbb', marginBottom: '24px', maxWidth: '500px', textAlign: 'center' }}>
            We encountered a temporary display issue. Click below to reload the main catalog.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/';
            }}
            style={{
              backgroundColor: '#e50914',
              color: '#ffffff',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Reload Home Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Native, rock-solid Firebase Auth hook (zero third-party hook incompatibility)
const useAuthUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (isMounted) {
          setUser(currentUser);
          setLoading(false);
        }
      },
      (error) => {
        console.warn("Auth listener warning:", error);
        if (isMounted) setLoading(false);
      }
    );

    // Safeguard timeout: Never let the app hang on a loading screen longer than 1 second
    const timeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return { user, loading };
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuthUser();

  if (loading) {
    return (
      <div className="login-spinner">
        <img src={netflix_spinner} alt="Loading..." />
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : children;
};

const App = () => {
  return (
    <ErrorBoundary>
      <ToastContainer theme="dark" />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/flyer" element={<FlyerPage />} />
        
        {/* Main movie streaming pages are accessible immediately with guest & user modes */}
        <Route path="/" element={<Home />} />
        <Route path="/series" element={<Series />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/player/:id" element={<Player />} />

        {/* Catch-all redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
