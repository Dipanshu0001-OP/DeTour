import { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Results from './pages/Results.jsx';
import ItineraryPage from './pages/ItineraryPage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import { fetchRecommendations } from './services/api.js';

export const DEFAULT_PREFS = {
  destination: 'Dehradun',
  origin: '',
  ageGroup: '18-24',
  groupType: 'solo',
  groupSize: 1,
  budgetPerPerson: 1500,
  interests: ['nature', 'culture', 'hidden-gems'],
  diet: 'vegetarian',
  durationDays: 1,
  hiddenGemsOnly: false,
  travelStyle: 'balanced',
  notes: '',
};

export default function App() {
  const [splash, setSplash] = useState(true);
  const [page, setPage] = useState('home');
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [res, setRes] = useState({ status: 'idle', items: [], error: null, source: null });
  const [itinerary, setItinerary] = useState([]);

  // Opening animation — short and respectful of reduced motion
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setSplash(false), prefersReduced ? 400 : 1600);
    return () => clearTimeout(t);
  }, []);

  const search = async () => {
    setPage('results');
    setRes((r) => ({ ...r, status: 'loading', error: null }));
    // Brief atmospheric pause so the loading state is visible
    await new Promise((r) => setTimeout(r, 900));
    try {
      const { items, source } = await fetchRecommendations(prefs);
      setRes({ status: 'done', items, error: null, source });
    } catch (e) {
      setRes({ status: 'error', items: [], error: e.message, source: null });
    }
  };

  const add = (p) =>
    setItinerary((l) => (l.some((x) => x.id === p.id) ? l : [...l, p]));

  const handleSelectDestination = (name) => {
    setPrefs((p) => ({ ...p, destination: name }));
  };

  const pages = {
    home: (
      <Home
        prefs={prefs}
        setPrefs={setPrefs}
        onSubmit={search}
        onSelectDestination={handleSelectDestination}
      />
    ),
    results: (
      <Results
        prefs={prefs}
        res={res}
        itinerary={itinerary}
        onAdd={add}
        onRetry={search}
        onEdit={() => setPage('home')}
        onGo={setPage}
      />
    ),
    itinerary: (
      <ItineraryPage
        prefs={prefs}
        recs={res.items}
        itinerary={itinerary}
        setItinerary={setItinerary}
        onGo={setPage}
      />
    ),
    community: (
      <CommunityPage onAdd={add} itinerary={itinerary} />
    ),
  };

  return (
    <>
      {/* Opening splash */}
      <div className={`splash ${splash ? '' : 'hide'}`} aria-hidden={!splash}>
        <div className="splash-logo">
          <img className="splash-mark" src="/detour-mark.svg" alt="" />
          <h1 className="splash-wordmark">DeTour</h1>
          <p className="splash-tag">Explore beyond the obvious</p>
          <div className="splash-path" />
        </div>
      </div>

      {!splash && (
        <>
          <Navbar page={page} onGo={setPage} count={itinerary.length} />
          <main>{pages[page]}</main>
        </>
      )}
    </>
  );
}
