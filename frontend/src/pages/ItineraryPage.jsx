import { useState } from 'react';
import { generateItinerary } from '../utils/itinerary.js';
import { optimizeBudget, calculateLocalImpact } from '../utils/budget.js';
import { formatPrice } from '../components/PlaceCard.jsx';
import BudgetSummary from '../components/BudgetSummary.jsx';
import { ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';

export default function ItineraryPage({ prefs, recs, itinerary, setItinerary, onGo }) {
  const [msg, setMsg] = useState('');
  const total = (prefs.budgetPerPerson || 0) * (prefs.groupSize || 1);
  const unused = recs.filter((r) => !itinerary.some((x) => x.id === r.id));

  const run = (fn) => {
    try {
      fn();
    } catch (e) {
      setMsg(`Something went wrong: ${e.message}`);
    }
  };

  const auto = () =>
    run(() => {
      setItinerary(generateItinerary(prefs, recs));
      setMsg('Itinerary generated from your top matches.');
    });

  const rescue = () =>
    run(() => {
      const r = optimizeBudget(itinerary, unused, prefs.budgetPerPerson);
      setItinerary(r.itinerary);
      setMsg(
        r.savings > 0
          ? `Budget Rescue saved ₹${r.savings * (prefs.groupSize || 1)} for the group.`
          : 'Already within budget — nothing to rescue.'
      );
    });

  const swap = (p) => {
    const alt = unused.find((r) => r.category === p.category);
    if (!alt) return setMsg('No compatible alternative to swap in.');
    setItinerary((l) => l.map((x) => (x.id === p.id ? alt : x)));
    setMsg(`Swapped “${p.name}” for “${alt.name}”.`);
  };

  const impact = calculateLocalImpact(itinerary);

  return (
    <div className="wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <button className="btn ghost small" onClick={() => onGo('results')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back to results
      </button>

      <h2>My DeTour</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        {prefs.destination || 'Your trip'} · {prefs.groupType} · {prefs.durationDays} day{prefs.durationDays > 1 ? 's' : ''}
      </p>

      {itinerary.length === 0 ? (
        <div className="state-box">
          <h3>Nothing here yet</h3>
          <p>Auto-generate from your matches or browse results and add experiences.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={auto} disabled={!recs.length}>
              <Sparkles size={16} /> Auto-generate
            </button>
            <button className="btn ghost" onClick={() => onGo('results')}>
              Browse results
            </button>
          </div>
        </div>
      ) : (
        <>
          <ol className="itin-list">
            {itinerary.map((p) => (
              <li key={p.id} className="itin-item">
                <div className="itin-num" />
                <div className="itin-body">
                  <h4>{p.name}</h4>
                  <div className="meta">
                    {p.durationMinutes} min · {formatPrice(p)}
                    {p.priceIsEstimate && p.pricePerPerson != null ? ' (est.)' : ''}
                    {p.city ? ` · ${p.city}` : ''}
                  </div>
                </div>
                <div className="itin-actions">
                  <button className="btn small ghost" onClick={() => swap(p)}>
                    Swap
                  </button>
                  <button
                    className="btn small ghost"
                    onClick={() => setItinerary((l) => l.filter((x) => x.id !== p.id))}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <BudgetSummary
            itinerary={itinerary}
            total={total}
            groupSize={prefs.groupSize || 1}
            impact={impact}
          />

          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn" onClick={rescue}>
              Budget Rescue
            </button>
            <button className="btn ghost" onClick={auto}>
              <RefreshCw size={16} /> Regenerate
            </button>
          </div>
        </>
      )}

      {msg && (
        <p role="status" className="muted" style={{ marginTop: 16 }}>
          {msg}
        </p>
      )}
    </div>
  );
}
