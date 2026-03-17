import HomepageSignup from './HomepageSignup' // Dosya yolunu nereye açtığına göre ayarla
import Navbar from './components/Navbar'

export default function Home() {
  return (
    <>
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <header className="hero" id="hero">
        <div className="hero-bg"></div>
        <div className="container hero-content">
          <div className="hero-text">
            <span className="hero-badge">🎓 For IZTECH Students</span>
            <h1>Discover Your Next <span className="highlight">Great Read</span></h1>
            <p className="hero-subtitle">Rate books from the campus library, share reviews with fellow students, and get
              personalized AI-powered recommendations tailored just for you.</p>
            <div className="hero-cta">
              <a href="#cta" className="btn btn-primary btn-lg">Start Reading Smarter</a>
              <a href="#how-it-works" className="btn btn-secondary btn-lg">See How It Works</a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-number">2,500+</span>
                <span className="hero-stat-label">Books Rated</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">850+</span>
                <span className="hero-stat-label">Active Readers</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">98%</span>
                <span className="hero-stat-label">Love Our AI Picks</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="book-stack">
              <div className="book book-1"></div>
              <div className="book book-2"></div>
              <div className="book book-3"></div>
              <div className="ai-sparkle">✨</div>
            </div>
          </div>
        </div>
        <div className="scroll-indicator">
          <span>Scroll to explore</span>
          <div className="scroll-arrow"></div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2>Everything You Need to <span className="highlight">Read Better</span></h2>
            <p>From rating books to getting AI-powered recommendations, we've got you covered.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Rate & Review</h3>
              <p>Share your thoughts on books from the IZTECH library. Help fellow students find their next
                favorite read with honest reviews.</p>
            </div>
            <div className="feature-card featured">
              <div className="feature-icon">🤖</div>
              <h3>AI Recommendations</h3>
              <p>Our smart AI learns your reading preferences and suggests books you'll love. The more you rate,
                the better it gets!</p>
              <span className="feature-badge">Powered by AI</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Student Community</h3>
              <p>Connect with fellow IZTECH readers. See what's trending on campus and discover hidden gems
                through peer reviews.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Reading Insights</h3>
              <p>Track your reading journey with detailed statistics. Set goals, celebrate milestones, and grow as
                a reader.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Smart Search</h3>
              <p>Find books by genre, author, rating, or even mood. Our advanced search helps you discover exactly
                what you're looking for.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Rate books on the go. Our responsive design works perfectly on any device, anywhere on campus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">How It Works</span>
            <h2>Get Started in <span className="highlight">3 Simple Steps</span></h2>
            <p>Join hundreds of IZTECH students already discovering great books.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Sign Up Free</h3>
                <p>Create your account with your IZTECH email. It takes less than 30 seconds to join our reading
                  community.</p>
              </div>
              <div className="step-icon">📧</div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Rate Some Books</h3>
                <p>Tell us about books you've read. Rate them, write quick reviews, and help train our AI to
                  understand your taste.</p>
              </div>
              <div className="step-icon">📝</div>
            </div>
            <div className="step-connector"></div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Get AI Recommendations</h3>
                <p>Receive personalized book suggestions based on your preferences. Discover your next favorite
                  read from our library!</p>
              </div>
              <div className="step-icon">🎯</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials" id="testimonials">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Testimonials</span>
            <h2>What Students <span className="highlight">Are Saying</span></h2>
            <p>Join the growing community of happy readers at IZTECH.</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">"The AI recommendations are scary accurate! It suggested 'Sapiens' after
                I rated a few history books, and I couldn't put it down. This app knows me better than I know
                myself!"</p>
              <div className="testimonial-author">
                <div className="author-avatar">AY</div>
                <div className="author-info">
                  <span className="author-name">Ayşe Yılmaz</span>
                  <span className="author-dept">Computer Engineering, 3rd Year</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">"Finally, a way to see what other IZTECH students are reading! I've
                discovered so many great books through the community reviews. The app made me fall in love with
                reading again."</p>
              <div className="testimonial-author">
                <div className="author-avatar">MK</div>
                <div className="author-info">
                  <span className="author-name">Mehmet Kaya</span>
                  <span className="author-dept">Mechanical Engineering, 2nd Year</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">"As someone who reads a lot but struggles to find new books, this is a
                game-changer. The personalized recommendations save me hours of browsing in the library!"</p>
              <div className="testimonial-author">
                <div className="author-avatar">EÖ</div>
                <div className="author-info">
                  <span className="author-name">Elif Özdemir</span>
                  <span className="author-dept">Architecture, 4th Year</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats" id="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number" data-target="2547">2547</div>
              <div className="stat-label">Books Rated</div>
              <div className="stat-icon">📚</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" data-target="856">856</div>
              <div className="stat-label">Active Students</div>
              <div className="stat-icon">👨‍🎓</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" data-target="12450">12450</div>
              <div className="stat-label">AI Recommendations</div>
              <div className="stat-icon">🤖</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" data-target="98">98</div>
              <div className="stat-label">% Satisfaction Rate</div>
              <div className="stat-icon">❤️</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta" id="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Find Your Next <span className="highlight">Favorite Book?</span></h2>
            <p>Join hundreds of IZTECH students already using Reader's Hub. It's free, it's smart, and it's made for
              you.</p>
            <HomepageSignup />

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <a href="#" className="logo">
                <span className="logo-icon">📚</span>
                <span className="logo-text">IZTECH <span className="highlight">Reader's Hub</span></span>
              </a>
              <p>Helping IZTECH students discover great books through community ratings and AI-powered
                recommendations.</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Platform</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#how-it-works">How It Works</a></li>
                  <li><a href="#testimonials">Reviews</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Resources</h4>
                <ul>
                  <li><a href="#">Help Center</a></li>
                  <li><a href="#">Reading Tips</a></li>
                  <li><a href="#">Blog</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Connect</h4>
                <ul>
                  <li><a href="#">Instagram</a></li>
                  <li><a href="#">Twitter</a></li>
                  <li><a href="#">Contact Us</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 IZTECH Reader's Hub. Made with ❤️ for IZTECH students.</p>
          </div>
        </div>
      </footer>
    </>
  )
}