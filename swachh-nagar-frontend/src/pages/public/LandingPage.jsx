import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import Navbar from '../../components/layout/Navbar';

const StatCard = ({ value, label }) => (
  <div className="text-center">
    <div className="text-3xl font-bold text-primary-600">{value}</div>
    <div className="text-sm text-gray-600 mt-1">{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="card hover:shadow-card-hover transition-shadow">
    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
      <span className="text-2xl">{icon}</span>
    </div>
    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
  </div>
);

const LandingPage = () => {
  const { t } = useLanguage();

  const features = [
    { icon: '📸', title: 'Photo Evidence', desc: 'Upload photos of issues with AI-powered validation to ensure authentic reports.' },
    { icon: '📍', title: 'Location Tracking', desc: 'Auto-detect your location or pin it on the map for precise issue reporting.' },
    { icon: '🔔', title: 'Real-time Updates', desc: 'Get instant notifications when your complaint status changes via SMS and app.' },
    { icon: '🏆', title: 'Gamification', desc: 'Earn points and badges for every report. Compete on the city leaderboard.' },
    { icon: '📊', title: 'Analytics', desc: 'See real-time data on cleanliness trends across your city and ward.' },
    { icon: '🗺️', title: 'Interactive Map', desc: 'View all active complaints on a live map with status-colored markers.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Swachh Bharat Mission — Digital Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {t('landing.hero_title')}
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 mb-10 max-w-2xl leading-relaxed">
              {t('landing.hero_subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-lg">
                🚀 {t('landing.cta_report')}
              </Link>
              <Link to="/map" className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/30 transition-colors border border-white/30">
                🗺️ View Live Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="12,450+" label={t('landing.stats_complaints')} />
            <StatCard value="8,200+" label={t('landing.stats_users')} />
            <StatCard value="156" label={t('landing.stats_cities')} />
            <StatCard value="48h" label={t('landing.stats_response')} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to make a difference</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">A complete platform for citizens and authorities to collaborate on keeping cities clean.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Report an Issue', desc: 'Spot a cleanliness problem? Take a photo, add location, and submit your report in under 60 seconds.' },
              { step: '02', title: 'Track Progress', desc: 'Follow your complaint in real-time. Get notified at every step from assignment to resolution.' },
              { step: '03', title: 'Earn Rewards', desc: 'Every resolved report earns you points. Climb the leaderboard and unlock exclusive badges.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center font-bold">{item.step}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join 8,000+ citizens making a difference</h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">Your report could be the one that makes your neighborhood cleaner. Start today, it takes less than a minute.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors shadow-lg text-lg">
            Get Started for Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">© 2026 Swachh Nagar. Made with 🌱 for a cleaner India.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
