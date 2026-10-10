import { useState } from 'react';
import PlaceCard from '../components/PlaceCard.jsx';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function Results({ prefs, res, itinerary, onAdd, onRetry, onEdit, onGo }) {
  const [filter, setFilter] = useState('all');

  if (res.status === 'idle') {
    return (
      <div className="state-box">
        <h3>No search yet</h3>
        <p>Tell us where you want to wander and we’ll find experiences for you.</p>
        <button className="btn" onClick={onEdit}>Start exploring</button>
      </div>
    );
  }

  if (res.status === 'loading') {
    return (
      <div className="dest-loading">
        <div className="spinner" />
        <h2>Unfolding {prefs.destination || 'your destination'}…</h2>
        <p>Finding paths beyond the obvious</p>
      </div>
    );
  }

  if (res.status === 'error') {
    return (
      <div className="state-box">
        <h3 className="err">Couldn’t load recommendations</h3>
        <p>{res.error}</p>
        <button className="btn" onClick={onRetry}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const items = res.items.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'food') return p.category === 'food';
    if (filter === 'gems') return p.tags?.includes('hidden-gem') || p.interests?.includes('hidden-gems');
    if (filter === 'community') return p.community?.isCommunityRun;
    if (filter === 'nature') return p.interests?.includes('nature') || p.category === 'attraction';
    if (filter === 'craft') return p.category === 'craft';
    return true;
  });

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <div className="results-header">
        <button className="btn ghost small" onClick={onEdit} style={{ marginBottom: 12 }}>
          <ArrowLeft size={16} /> Edit preferences
        </button>
        <h2>Your matches for {prefs.destination || 'this trip'}</h2>
        <p className="results-meta">
          {res.items.length} experience{res.items.length !== 1 ? 's' : ''} found · Source: {res.source === 'aws' ? 'AWS API' : 'local engine'}
          {prefs.budgetPerPerson != null && ` · Budget ₹${prefs.budgetPerPerson}/person`}
        </p>
      </div>

      <div className="chips" style={{ marginBottom: 24 }}>
        {[
          ['all', 'All'],
          ['gems', 'Hidden gems'],
          ['food', 'Food'],
          ['nature', 'Nature'],
          ['craft', 'Crafts'],
          ['community', 'Community'],
        ].map(([k, l]) => (
          <button
            key={k}
            className={filter === k ? 'chip on' : 'chip'}
            onClick={() => setFilter(k)}
          >
            {l}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="state-box">
          <h3>No experiences match these filters</h3>
          <p>Try a higher budget, more interests, or turn off Hidden Gem Mode.</p>
          <button className="btn" onClick={onEdit}>Adjust preferences</button>
        </div>
      ) : (
        <div className="grid">
          {items.map((p) => (
            <PlaceCard
              key={p.id}
              p={p}
              added={itinerary.some((x) => x.id === p.id)}
              onAdd={onAdd}
            />
          ))}
        </div>
      )}

      {itinerary.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <button className="btn large" onClick={() => onGo('itinerary')}>
            View My DeTour ({itinerary.length})
          </button>
        </div>
      )}
    </div>
  );
}
