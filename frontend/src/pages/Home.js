import React from 'react';
import { Link } from 'react-router-dom';
import { FaVideo, FaGlobe, FaLock, FaComments, FaForward, FaSlidersH, FaShieldAlt, FaArrowRight, FaUsers, FaClock, FaCheckCircle } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Section */}
      <section className="bg-secondary/30 py-20 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-6">
                <h1 className="text-5xl md:text-6xl font-bold text-accent1 mb-2">FaceUnknown</h1>
                <p className="text-xl md:text-2xl text-text/70 font-medium">Connect. Chat. Discover.</p>
              </div>
              <p className="text-lg md:text-xl text-text/80 mb-8 leading-relaxed">
                Experience anonymous video chat with people from around the world. 
                Start meaningful conversations, make new friends, and explore diverse perspectives.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/register" 
                  className="px-8 py-4 bg-accent1 hover:bg-accent1/90 text-primary rounded-lg text-lg font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-1 text-center"
                >
                  Get Started
                </Link>
                <Link 
                  to="/login" 
                  className="px-8 py-4 bg-accent2 hover:bg-accent2/90 text-primary rounded-lg text-lg font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-1 text-center"
                >
                  Sign In
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-md bg-secondary/50 rounded-3xl p-12 shadow-2xl border-2 border-text/20">
                <div className="flex justify-center">
                  <FaVideo className="text-8xl text-accent1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-primary">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-text text-center mb-16">Why Choose FaceUnknown?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-secondary/50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-text/10">
              <div className="text-5xl text-accent1 mb-4 flex justify-center">
                <FaGlobe />
              </div>
              <h3 className="text-2xl font-bold text-text mb-3 text-center">Global Connections</h3>
              <p className="text-text/70 text-center leading-relaxed">Connect with users from all over the world. Break down barriers and discover new cultures.</p>
            </div>
            <div className="bg-secondary/50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-text/10">
              <div className="text-5xl text-accent2 mb-4 flex justify-center">
                <FaLock />
              </div>
              <h3 className="text-2xl font-bold text-text mb-3 text-center">Secure & Private</h3>
              <p className="text-text/70 text-center leading-relaxed">Your privacy is our priority. Anonymous connections with built-in safety features.</p>
            </div>
            <div className="bg-secondary/50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-text/10">
              <div className="text-5xl text-accent1 mb-4 flex justify-center">
                <FaComments />
              </div>
              <h3 className="text-2xl font-bold text-text mb-3 text-center">Text & Video Chat</h3>
              <p className="text-text/70 text-center leading-relaxed">Communicate through both video and text chat. Switch between modes seamlessly.</p>
            </div>
            <div className="bg-secondary/50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-text/10">
              <div className="text-5xl text-accent2 mb-4 flex justify-center">
                <FaForward />
              </div>
              <h3 className="text-2xl font-bold text-text mb-3 text-center">Skip Anytime</h3>
              <p className="text-text/70 text-center leading-relaxed">Not feeling the connection? Skip to the next person with a single click.</p>
            </div>
            <div className="bg-secondary/50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-text/10">
              <div className="text-5xl text-accent1 mb-4 flex justify-center">
                <FaSlidersH />
              </div>
              <h3 className="text-2xl font-bold text-text mb-3 text-center">Full Control</h3>
              <p className="text-text/70 text-center leading-relaxed">Control your camera and microphone. You decide when to share your video and audio.</p>
            </div>
            <div className="bg-secondary/50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-text/10">
              <div className="text-5xl text-accent2 mb-4 flex justify-center">
                <FaShieldAlt />
              </div>
              <h3 className="text-2xl font-bold text-text mb-3 text-center">Safe Environment</h3>
              <p className="text-text/70 text-center leading-relaxed">Advanced moderation tools and reporting system to ensure a safe experience for everyone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-text text-center mb-16">How It Works</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4">
            <div className="bg-primary p-8 rounded-2xl shadow-lg border-2 border-accent1 flex-1 max-w-sm text-center">
              <div className="w-16 h-16 bg-accent1 text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-2xl font-bold text-text mb-3">Create Account</h3>
              <p className="text-text/70 leading-relaxed">Sign up for free and complete your profile to get started.</p>
            </div>
            <div className="hidden md:block text-4xl text-accent1">
              <FaArrowRight />
            </div>
            <div className="bg-primary p-8 rounded-2xl shadow-lg border-2 border-accent1 flex-1 max-w-sm text-center">
              <div className="w-16 h-16 bg-accent1 text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-2xl font-bold text-text mb-3">Start Chatting</h3>
              <p className="text-text/70 leading-relaxed">Click "Start Chatting" to connect with a random user from anywhere in the world.</p>
            </div>
            <div className="hidden md:block text-4xl text-accent1">
              <FaArrowRight />
            </div>
            <div className="bg-primary p-8 rounded-2xl shadow-lg border-2 border-accent1 flex-1 max-w-sm text-center">
              <div className="w-16 h-16 bg-accent1 text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-2xl font-bold text-text mb-3">Connect & Chat</h3>
              <p className="text-text/70 leading-relaxed">Video chat or text message with your match. Skip anytime to find someone new.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-accent1">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-primary mb-2">1000+</div>
              <div className="text-xl text-primary/90 font-semibold">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-primary mb-2">50+</div>
              <div className="text-xl text-primary/90 font-semibold">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-primary mb-2">24/7</div>
              <div className="text-xl text-primary/90 font-semibold">Available</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-primary mb-2">100%</div>
              <div className="text-xl text-primary/90 font-semibold">Free</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-text/70 mb-8">Join thousands of users connecting and chatting every day</p>
          <Link 
            to="/register" 
            className="inline-block px-8 py-4 bg-accent1 hover:bg-accent1/90 text-primary rounded-lg text-lg font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Join FaceUnknown Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text text-primary py-12 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-xl font-bold mb-4">FaceUnknown</h4>
              <p className="text-primary/80">Connecting people through anonymous video chat</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Quick Links</h4>
              <div className="flex flex-col gap-2">
                <Link to="/login" className="text-primary/80 hover:text-primary transition-colors">Sign In</Link>
                <Link to="/register" className="text-primary/80 hover:text-primary transition-colors">Sign Up</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Features</h4>
              <div className="flex flex-col gap-2 text-primary/80">
                <p>Video Chat</p>
                <p>Text Messaging</p>
                <p>Global Connections</p>
              </div>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Safety</h4>
              <div className="flex flex-col gap-2 text-primary/80">
                <p>Report Users</p>
                <p>Moderation</p>
                <p>Privacy First</p>
              </div>
            </div>
          </div>
          <div className="border-t border-primary/20 pt-8 text-center text-primary/80">
            <p>&copy; 2025 FaceUnknown. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
