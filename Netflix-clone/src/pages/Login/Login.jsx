import React, { useState, useEffect } from 'react';
import './Login.css';
import logo from '../../assets/logo.png';
import { login, signup, resetPassword } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import netflix_spinner from '../../assets/netflix_spinner.gif';
import { 
  FaEye, 
  FaEyeSlash, 
  FaKey, 
  FaEnvelope, 
  FaEnvelopeOpenText, 
  FaArrowLeft,
  FaRedo
} from 'react-icons/fa';

const Login = () => {
  const [signState, setSignState] = useState("Sign In");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const validateForm = () => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!trimmedEmail) {
      return "Please enter your email address.";
    }

    if (!emailRegex.test(trimmedEmail)) {
      return "Please enter a valid email address (e.g., name@gmail.com).";
    }

    if (signState === "Reset Password") {
      return null;
    }

    if (signState === "Sign Up") {
      if (!name.trim()) {
        return "Please enter your name.";
      }
      if (password.length < 8) {
        return "Password must be at least 8 characters long.";
      }
      if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase (capital) letter.";
      }
    } else {
      if (!password) {
        return "Please enter your password.";
      }
    }

    return null;
  };

  const user_auth = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);
    try {
      if (signState === "Sign In") {
        await login(email.trim(), password);
        navigate("/");
      } else if (signState === "Sign Up") {
        await signup(name.trim(), email.trim(), password);
        navigate("/");
      } else if (signState === "Reset Password") {
        await resetPassword(email.trim());
        setResetSent(true);
        setResendCooldown(30);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendReset = async () => {
    if (resendCooldown > 0 || !email.trim()) return;
    setErrorMsg("");
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setResendCooldown(30);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchState = (newState) => {
    setSignState(newState);
    setErrorMsg("");
    setResetSent(false);
    setShowPassword(false);
  };

  return (
    loading && signState !== "Reset Password" ? (
      <div className="login-spinner">
        <img src={netflix_spinner} alt="Loading..." />
      </div>
    ) : (
      <div className='login'>
        <div className="login-bg"></div>
        <img src={logo} className='login-logo' alt="Netflix Logo" />
        
        <div className={`login-form ${signState === "Reset Password" ? 'reset-card-mode' : ''}`}>
          
          {/* ========================================= */}
          {/* SCENARIO 1: Password Reset Email Sent Success */}
          {/* ========================================= */}
          {signState === "Reset Password" && resetSent ? (
            <div className="reset-sent-container">
              <div className="sent-icon-circle">
                <FaEnvelopeOpenText />
              </div>
              <h2 className="sent-title">Check Your Inbox</h2>
              <p className="sent-subtitle">
                A password reset link has been dispatched to:
              </p>

              <div className="sent-email-badge">
                <FaEnvelope className="badge-icon" />
                <span className="badge-email">{email}</span>
              </div>

              <div className="sent-instructions-card">
                <div className="instruction-step">
                  <span className="step-number">1</span>
                  <p>Check the email from <strong>Firebase / Netflix</strong>.</p>
                </div>
                <div className="instruction-step">
                  <span className="step-number">2</span>
                  <p>Click the secure password reset link provided.</p>
                </div>
                <div className="instruction-step">
                  <span className="step-number">3</span>
                  <p>Create your new password and return here to sign in.</p>
                </div>
              </div>

              <p className="sent-spam-tip">
                Didn't see it? Be sure to check your <strong>Spam / Junk</strong> folder.
              </p>

              <div className="sent-actions-row">
                {email.toLowerCase().includes('gmail.com') ? (
                  <a 
                    href="https://mail.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="action-btn open-gmail-btn"
                  >
                    Open Gmail ↗
                  </a>
                ) : (
                  <a 
                    href="https://mail.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="action-btn open-gmail-btn"
                  >
                    Open Webmail ↗
                  </a>
                )}

                <button 
                  type="button"
                  className="action-btn resend-email-btn"
                  onClick={handleResendReset}
                  disabled={resendCooldown > 0 || loading}
                >
                  <FaRedo className={loading ? 'spinning-icon' : ''} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Link"}
                </button>
              </div>

              {errorMsg && <p className="error-message">{errorMsg}</p>}

              <button 
                type="button" 
                className="back-signin-text-btn"
                onClick={() => switchState("Sign In")}
              >
                <FaArrowLeft /> Return to Sign In
              </button>
            </div>
          ) : (
            /* ========================================= */
            /* SCENARIO 2: Sign In / Sign Up / Reset Form */
            /* ========================================= */
            <>
              {signState === "Reset Password" ? (
                <div className="reset-form-header">
                  <div className="reset-lock-badge">
                    <FaKey />
                  </div>
                  <h1>Reset Password</h1>
                  <p className="reset-instruction-text">
                    Enter the email registered with your account and we will send a password reset link directly to your inbox.
                  </p>
                </div>
              ) : (
                <h1>{signState}</h1>
              )}

              <form onSubmit={user_auth}>
                {signState === "Sign Up" && (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    placeholder='Your name'
                    required
                  />
                )}

                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder='Email address (e.g. name@gmail.com)'
                  required
                  autoFocus={signState === "Reset Password"}
                />

                {signState !== "Reset Password" && (
                  <div className="password-input-container">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder='Password'
                      required
                    />
                    <span
                      className="password-toggle-icon"
                      onClick={() => setShowPassword((prev) => !prev)}
                      title={showPassword ? "Hide password" : "Show password"}
                      role="button"
                      tabIndex={0}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                )}

                {signState === "Sign Up" && (
                  <p className="password-hint">
                    Must be at least 8 characters with at least 1 uppercase letter.
                  </p>
                )}

                <button 
                  type='submit' 
                  disabled={loading}
                  className="auth-submit-btn"
                >
                  {loading 
                    ? "Processing..." 
                    : signState === "Reset Password" 
                    ? "Send Reset Link to Gmail" 
                    : signState
                  }
                </button>

                {errorMsg && <p className="error-message">{errorMsg}</p>}

                {signState === "Sign In" && (
                  <div className="form-help">
                    <div className="remember">
                      <input type="checkbox" id="rememberMe" />
                      <label htmlFor="rememberMe">Remember Me</label>
                    </div>
                    <span 
                      className="forgot-password-link" 
                      onClick={() => switchState("Reset Password")}
                    >
                      Forgot Password?
                    </span>
                  </div>
                )}

                {signState === "Reset Password" && (
                  <div className="reset-back-row">
                    <span 
                      className="back-to-signin-link"
                      onClick={() => switchState("Sign In")}
                    >
                      <FaArrowLeft /> Back to Sign In
                    </span>
                  </div>
                )}
              </form>

              {signState !== "Reset Password" && (
                <div className="form-switch">
                  {signState === "Sign In" ? (
                    <p>
                      New to Netflix?{" "}
                      <span onClick={() => switchState("Sign Up")}>Sign Up Now</span>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{" "}
                      <span onClick={() => switchState("Sign In")}>Sign In Now</span>
                    </p>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    )
  );
};

export default Login;
