import { useState } from 'react';
import {
  User, Users, Heart, Home, UserPlus,
  TreePine, Mountain, UtensilsCrossed, Landmark,
  Camera, Palette, Sparkles, Eye, HandHeart,
  IndianRupee, Clock, Leaf,
} from 'lucide-react';

const GROUPS = [
  { id: 'solo', label: 'Solo', icon: User },
  { id: 'couple', label: 'Couple', icon: Heart },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'family', label: 'Family', icon: Home },
  { id: 'group', label: 'Group', icon: UserPlus },
];

const INTERESTS = [
  { id: 'nature', label: 'Nature & views', icon: TreePine },
  { id: 'adventure', label: 'Adventure', icon: Mountain },
  { id: 'food', label: 'Food & cafés', icon: UtensilsCrossed },
  { id: 'culture', label: 'Culture & history', icon: Landmark },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'crafts', label: 'Local crafts', icon: Palette },
  { id: 'spiritual', label: 'Spiritual', icon: Sparkles },
  { id: 'hidden-gems', label: 'Hidden gems', icon: Eye },
  { id: 'community', label: 'Community', icon: HandHeart },
];

const STYLES = [
  { id: 'popular', label: 'Popular highlights', desc: 'Well-loved spots with reliable access' },
  { id: 'balanced', label: 'A balanced mix', desc: 'Known places + a few surprises' },
  { id: 'hidden', label: 'Hidden gems only', desc: 'Off the beaten path as much as possible' },
];

export default function PreferenceWizard({ prefs, setPrefs, onSubmit, destination }) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const set = (k, v) => setPrefs((p) => ({ ...p, [k]: v }));
  const toggleInterest = (id) => {
    const cur = prefs.interests || [];
    set('interests', cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };

  const canNext = () => {
    if (step === 2) return !!prefs.groupType;
    if (step === 3) return (prefs.interests || []).length > 0;
    return true;
  };

  const next = () => {
    if (step < totalSteps) setStep((s) => s + 1);
    else onSubmit();
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  // Sync hiddenGemsOnly from style choice
  const selectStyle = (id) => {
    set('travelStyle', id);
    set('hiddenGemsOnly', id === 'hidden');
  };

  return (
    <div className="pref-flow">
      <div className="pref-progress" aria-hidden="true">
        {Array.from({ length: totalSteps }, (_, i) => (
          <span
            key={i}
            className={i + 1 < step ? 'done' : i + 1 === step ? 'active' : ''}
          />
        ))}
      </div>

      {/* Step 1 — Origin */}
      {step === 1 && (
        <div className="pref-step">
          <h2>Where are you coming from?</h2>
          <p className="sub">This helps us understand travel context. Optional for now.</p>
          <div className="pref-fields">
            <label>
              Starting city
              <input
                type="text"
                placeholder="e.g. Delhi, Mumbai, Chandigarh…"
                value={prefs.origin || ''}
                onChange={(e) => set('origin', e.target.value)}
              />
            </label>
          </div>
        </div>
      )}

      {/* Step 2 — Who's joining */}
      {step === 2 && (
        <div className="pref-step">
          <h2>Who is joining the detour?</h2>
          <p className="sub">We'll tailor experiences to your group.</p>
          <div className="pref-options">
            {GROUPS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`pref-option ${prefs.groupType === id ? 'selected' : ''}`}
                onClick={() => set('groupType', id)}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>
          {['friends', 'family', 'group'].includes(prefs.groupType) && (
            <div className="pref-fields">
              <label>
                Group size
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={prefs.groupSize || 2}
                  onChange={(e) => set('groupSize', Math.max(2, +e.target.value || 2))}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Interests */}
      {step === 3 && (
        <div className="pref-step">
          <h2>What speaks to you?</h2>
          <p className="sub">Pick everything that sparks curiosity. Multiple selections welcome.</p>
          <div className="pref-options">
            {INTERESTS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`pref-option ${(prefs.interests || []).includes(id) ? 'selected' : ''}`}
                onClick={() => toggleInterest(id)}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4 — Travel style details */}
      {step === 4 && (
        <div className="pref-step">
          <h2>What is your travel style?</h2>
          <p className="sub">A few practical details so we can keep things realistic.</p>
          <div className="pref-fields">
            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IndianRupee size={16} /> Budget per person (₹)
              </span>
              <input
                type="number"
                min={0}
                step={100}
                value={prefs.budgetPerPerson}
                onChange={(e) => set('budgetPerPerson', Math.max(0, +e.target.value || 0))}
              />
            </label>
            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={16} /> Trip duration (days)
              </span>
              <input
                type="number"
                min={1}
                max={14}
                value={prefs.durationDays}
                onChange={(e) => set('durationDays', Math.min(14, Math.max(1, +e.target.value || 1)))}
              />
            </label>
            <label>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Leaf size={16} /> Dietary preference
              </span>
              <select
                value={prefs.diet}
                onChange={(e) => set('diet', e.target.value)}
              >
                <option value="any">No preference</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="non-vegetarian">Non-vegetarian</option>
              </select>
            </label>
            <label>
              Age range
              <select
                value={prefs.ageGroup}
                onChange={(e) => set('ageGroup', e.target.value)}
              >
                <option value="under-18">Under 18</option>
                <option value="18-24">18–24</option>
                <option value="25-34">25–34</option>
                <option value="35-54">35–54</option>
                <option value="55+">55+</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Step 5 — How far off the path + summary */}
      {step === 5 && (
        <div className="pref-step">
          <h2>How far off the beaten path?</h2>
          <p className="sub">Choose the kind of discovery you want.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {STYLES.map(({ id, label, desc }) => (
              <button
                key={id}
                type="button"
                className={`pref-option ${prefs.travelStyle === id || (id === 'hidden' && prefs.hiddenGemsOnly) || (id === 'balanced' && !prefs.travelStyle && !prefs.hiddenGemsOnly) ? 'selected' : ''}`}
                style={{ flexDirection: 'row', justifyContent: 'flex-start', textAlign: 'left', padding: '16px 18px' }}
                onClick={() => selectStyle(id)}
              >
                <div>
                  <strong>{label}</strong>
                  <div className="muted" style={{ fontSize: '0.85rem', marginTop: 2 }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="pref-summary">
            <h3 style={{ marginBottom: 12 }}>Your detour</h3>
            <dl>
              <dt>Destination</dt>
              <dd>{destination || prefs.destination || 'Dehradun'}</dd>
              <dt>Group</dt>
              <dd>{prefs.groupType}{prefs.groupSize > 1 ? ` · ${prefs.groupSize} people` : ''}</dd>
              <dt>Interests</dt>
              <dd>{(prefs.interests || []).join(', ') || '—'}</dd>
              <dt>Budget</dt>
              <dd>₹{prefs.budgetPerPerson} / person · {prefs.durationDays} day{prefs.durationDays > 1 ? 's' : ''}</dd>
              <dt>Diet</dt>
              <dd>{prefs.diet === 'any' ? 'No preference' : prefs.diet}</dd>
              <dt>Style</dt>
              <dd>{prefs.hiddenGemsOnly ? 'Hidden gems' : prefs.travelStyle === 'popular' ? 'Popular highlights' : 'Balanced mix'}</dd>
            </dl>
          </div>
        </div>
      )}

      <div className="pref-actions">
        <button className="btn ghost" disabled={step === 1} onClick={back}>
          Back
        </button>
        <button className="btn" disabled={!canNext()} onClick={next}>
          {step === totalSteps ? 'Build My DeTour' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
