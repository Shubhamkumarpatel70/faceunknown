import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-logo">
            <h1 className="logo-text">FaceUnknown</h1>
            <p className="logo-tagline">Connect. Chat. Discover.</p>
          </div>
          <p className="hero-description">
            Experience anonymous video chat with people from around the world. 
            Start meaningful conversations, make new friends, and explore diverse perspectives.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-large">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large">
              Sign In
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="video-preview">
            <div className="video-placeholder-icon">🎥</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose FaceUnknown?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Global Connections</h3>
            <p>Connect with users from all over the world. Break down barriers and discover new cultures.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Private</h3>
            <p>Your privacy is our priority. Anonymous connections with built-in safety features.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Text & Video Chat</h3>
            <p>Communicate through both video and text chat. Switch between modes seamlessly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏭️</div>
            <h3>Skip Anytime</h3>
            <p>Not feeling the connection? Skip to the next person with a single click.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎛️</div>
            <h3>Full Control</h3>
            <p>Control your camera and microphone. You decide when to share your video and audio.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Safe Environment</h3>
            <p>Advanced moderation tools and reporting system to ensure a safe experience for everyone.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create Account</h3>
            <p>Sign up for free and complete your profile to get started.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Start Chatting</h3>
            <p>Click "Start Chatting" to connect with a random user from anywhere in the world.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Connect & Chat</h3>
            <p>Video chat or text message with your match. Skip anytime to find someone new.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">1000+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Countries</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Free</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join thousands of users connecting and chatting every day</p>
          <Link to="/register" className="btn btn-primary btn-large">
            Join FaceUnknown Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>FaceUnknown</h4>
            <p>Connecting people through anonymous video chat</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Sign Up</Link>
          </div>
          <div className="footer-section">
            <h4>Features</h4>
            <p>Video Chat</p>
            <p>Text Messaging</p>
            <p>Global Connections</p>
          </div>
          <div className="footer-section">
            <h4>Safety</h4>
            <p>Report Users</p>
            <p>Moderation</p>
            <p>Privacy First</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 FaceUnknown. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

