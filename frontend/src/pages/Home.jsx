import { useState } from 'react';
import { Search, ArrowRight, MapPin, Compass, Leaf, X, Clock3, Sparkles, HeartHandshake } from 'lucide-react';
import PreferenceWizard from '../components/PreferenceWizard.jsx';
import { DESTINATIONS } from '../data/demoPlaces.js';

const POPULAR = [
  { name: "Robber's Cave", place: 'Dehradun', tag: 'Nature · Hidden gem', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&q=85', desc: 'Follow the stream through a narrow rocky gorge, surrounded by forest and cool mountain air.', time: '1–2 hours', cost: 'Low-cost outing' },
  { name: 'Forest Research Institute', place: 'Dehradun', tag: 'Architecture · Heritage', image: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=900&q=85', desc: 'A grand forest campus known for its monumental colonial-era architecture and expansive lawns.', time: '1–2 hours', cost: 'Check current visitor access' },
  { name: 'Sahastradhara', place: 'Dehradun', tag: 'Water · Outdoors', image: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=900&q=85', desc: 'A popular waterfall and spring area with green hills and a refreshing change of pace from the city.', time: '2–3 hours', cost: 'Prices may vary' },
  { name: 'George Everest Estate', place: 'Mussoorie', tag: 'Views · Outdoors', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=85', desc: 'Open Himalayan views, walking trails and a historic estate outside the busiest parts of Mussoorie.', time: 'Half day', cost: 'Check local access' },
];

const HIDDEN = [
  { name: 'Santala Devi Trail', desc: 'A forested climb with a quieter hilltop destination.', tag: 'Trail', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&q=85', place: 'Dehradun' },
  { name: 'Khalanga Memorial', desc: 'A forest-side historical stop with a story from the Anglo-Nepalese War.', tag: 'History', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&q=85', place: 'Dehradun' },
  { name: 'Lacchiwala Forest', desc: 'Sal trees, picnic paths and a slower afternoon outdoors.', tag: 'Nature', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&q=85', place: 'Dehradun' },
  { name: 'Aipan Art', desc: 'Discover Uttarakhand’s red-and-white ritual art and the people keeping it alive.', tag: 'Living craft', image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=900&q=85', place: 'Dehradun' },
];

const LOCALS = [
  { name: 'Local artisan workshops', type: 'Craft & culture', desc: 'Look for Aipan artists and regional craft demonstrations. Listings need confirmation before booking.', image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=900&q=85' },
  { name: 'Community food experiences', type: 'Food & heritage', desc: 'Discover regional dishes and small food makers, with dietary information checked before you go.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85' },
  { name: 'Local environmental initiatives', type: 'Nature & impact', desc: 'Find community and conservation activities where participation details are publicly available.', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=85' },
];

const STORIES = [
  { label: 'TRADITION', title: 'The art of Aipan', text: 'A red-and-white folk art associated with rituals and festivals in Kumaon and Uttarakhand.', image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=900&q=85' },
  { label: 'FOOD', title: 'A taste of the hills', text: 'Mandua, kafuli and aloo ke gutke tell stories of seasonal ingredients and mountain kitchens.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85' },
  { label: 'LANDSCAPE', title: 'A valley between worlds', text: 'Dehradun brings together forest edges, a lively city and the first folds of the Himalayas.', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=900&q=85' },
];

function DetailModal({ item, onClose, onExplore }) {
  if (!item) return null;
  return (
    <div className="detail-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button className="detail-close" onClick={onClose} aria-label="Close details"><X size={20} /></button>
        {item.image && <img className="detail-image" src={item.image} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
        <div className="detail-content">
          <span className="eyebrow">{item.tag || item.type || 'A DeTour discovery'}</span>
          <h2 id="detail-title">{item.name}</h2>
          {item.place && <p className="detail-place"><MapPin size={15} /> {item.place}, Uttarakhand</p>}
          <p>{item.desc || item.blurb || item.text}</p>
          {item.time && <div className="detail-facts"><span><Clock3 size={15} /> {item.time}</span><span>{item.cost}</span></div>}
          <p className="detail-note">Travel details, access and prices can change. Confirm locally before setting out.</p>
          <button className="btn" onClick={() => onExplore(item.place || item.name || 'Dehradun')}>Plan a visit <ArrowRight size={17} /></button>
        </div>
      </section>
    </div>
  );
}

export default function Home({ prefs, setPrefs, onSubmit, onSelectDestination }) {
  const [query, setQuery] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleExplore = (destName) => {
    const name = destName || query.trim() || 'Dehradun';
    setSelected(null);
    setPrefs((p) => ({ ...p, destination: name }));
    if (onSelectDestination) onSelectDestination(name);
    setShowWizard(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showWizard) return <PreferenceWizard prefs={prefs} setPrefs={setPrefs} onSubmit={onSubmit} destination={prefs.destination} />;

  return (
    <>
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-kicker"><span /> YOUR NEXT STORY STARTS HERE</div>
          <h1>Somewhere extraordinary is <em>closer than you think.</em></h1>
          <p className="lead">Find the places, people, flavours and stories most travellers miss.</p>
          <div className="hero-search">
            <MapPin size={19} className="search-pin" />
            <input type="text" placeholder="Where do you want to wander?" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleExplore()} aria-label="Destination search" />
            <button className="btn" onClick={() => handleExplore()}><Search size={18} /> Explore</button>
          </div>
          <div className="hero-suggestions"><span>START SOMEWHERE</span>{['Dehradun', 'Mussoorie', 'Rishikesh', 'Nainital'].map((d) => <button key={d} onClick={() => handleExplore(d)}>{d}</button>)}</div>
          <div className="hero-footnote"><Compass size={15} /> Less checklist. More discovery.</div>
        </div>
        <div className="hero-side-note">UTTARAKHAND & BEYOND <span>30°19′N · 78°02′E</span></div>
      </section>

      <section className="intro-strip"><div className="wrap intro-strip-inner"><span className="eyebrow">THE DETOUR DIFFERENCE</span><p>Not just where to go. <em>What makes it worth going.</em></p><span className="intro-mark"><Sparkles size={20} /></span></div></section>

      <section className="section">
        <div className="wrap">
          <div className="section-header"><div><span className="eyebrow">A COUNTRY OF STORIES</span><h2>India, beyond the postcards</h2><p>Start with a destination. We’ll help you see it differently.</p></div><span className="section-index">01 / DESTINATIONS</span></div>
          <div className="grid destination-grid">{DESTINATIONS.map((d, i) => <button key={d.id} className={`dest-card dest-card-${i + 1}`} onClick={() => setSelected({ ...d, place: d.name, tag: d.region, desc: d.blurb })}><img src={d.image} alt={d.name} loading="lazy" /><span className="dest-card-index">0{i + 1}</span><div className="dest-card-overlay"><span>{d.region}</span><h3>{d.name}</h3><p>{d.blurb}</p><span className="card-arrow"><ArrowRight size={18} /></span></div></button>)}</div>
        </div>
      </section>

      <section className="section section-tinted"><div className="wrap"><div className="section-header"><div><span className="eyebrow">THE PLACES TO KNOW</span><h2>Worth the detour</h2><p>Well-loved places and local favourites to start exploring. Popularity is editorial, not live visitor-count data.</p></div><span className="section-index">02 / FIELD NOTES</span></div>
        <div className="experience-grid">{POPULAR.map((item, i) => <button key={item.name} className="experience-card" onClick={() => setSelected(item)}><div className="experience-image"><img src={item.image} alt={item.name} loading="lazy" /><span className="image-number">0{i + 1}</span><span className="image-arrow"><ArrowRight size={17} /></span></div><div className="experience-copy"><span className="tag green">{item.tag}</span><h3>{item.name}</h3><p><MapPin size={14} /> {item.place}</p></div></button>)}</div>
      </div></section>

      <section className="section"><div className="wrap"><div className="section-header"><div><span className="eyebrow">TAKE THE LESS-TRAVELLED TURN</span><h2>Hidden in plain sight</h2><p>Trails, stories and traditions around the Doon valley, beyond the usual itinerary.</p></div><span className="section-index">03 / HIDDEN GEMS</span></div>
        <div className="hidden-grid">{HIDDEN.map((item, i) => <button className="hidden-card" key={item.name} onClick={() => setSelected(item)}><img src={item.image} alt={item.name} loading="lazy" /><div className="hidden-copy"><span className="tag gem">{item.tag}</span><h3>{item.name}</h3><p>{item.desc}</p><span className="text-link">Uncover the story <ArrowRight size={15} /></span></div></button>)}</div>
      </div></section>

      <section className="community-band"><div className="wrap"><div className="community-band-heading"><div><span className="eyebrow">TRAVEL THAT GIVES BACK</span><h2>Meet the people behind the place.</h2><p>Discover local makers, community initiatives and the stories that deserve a bigger audience.</p></div><div className="community-stamp"><HeartHandshake size={30} /><span>GO LOCAL<br />LEAVE A LIGHTER FOOTPRINT</span></div></div>
        <div className="local-grid">{LOCALS.map((item) => <button className="local-card" key={item.name} onClick={() => setSelected({ ...item, desc: `${item.desc} This is a discovery category, not a verified organization listing.` })}><img src={item.image} alt="" loading="lazy" /><div><span className="eyebrow">{item.type}</span><h3>{item.name}</h3><p>{item.desc}</p><span className="text-link">Explore community experiences <ArrowRight size={15} /></span></div></button>)}</div>
        <p className="community-disclaimer">Community categories are illustrative discovery prompts. Individual NGOs, partnerships and providers will be labelled only when independently confirmed.</p>
      </div></section>

      <section className="section"><div className="wrap"><div className="section-header"><div><span className="eyebrow">A LITTLE CONTEXT GOES A LONG WAY</span><h2>Small detours, big stories</h2><p>Local traditions and details that make a place more than a pin on a map.</p></div><span className="section-index">04 / LOCAL STORIES</span></div>
        <div className="story-grid">{STORIES.map((s) => <button key={s.title} className="story-card" onClick={() => setSelected({ ...s, name: s.title, desc: s.text, place: 'Dehradun' })}><img src={s.image} alt="" loading="lazy" /><div className="story-card-body"><span className="eyebrow">{s.label}</span><h3>{s.title}</h3><p>{s.text}</p><span className="text-link">Read the story <ArrowRight size={15} /></span></div></button>)}</div>
      </div></section>

      <section className="final-cta"><div className="final-cta-bg" /><div className="wrap final-cta-content"><span className="eyebrow">YOUR MAP IS ONLY THE BEGINNING</span><h2>Leave room for the unexpected.</h2><p>Tell us what you love, what you want to spend, and who’s coming along. We’ll help shape a more personal way through Dehradun and beyond.</p><button className="btn large" onClick={() => handleExplore('Dehradun')}>Build my DeTour <ArrowRight size={18} /></button></div></section>
      <footer className="site-footer"><div className="wrap"><div className="footer-brand"><span className="brand-symbol"><Compass size={20} /></span><span>DeTour<small>Explore beyond the obvious.</small></span></div><p>Made for curious travellers. Start local, wander further.</p><span>DEHRADUN · UTTARAKHAND · INDIA</span></div></footer>
      <DetailModal item={selected} onClose={() => setSelected(null)} onExplore={handleExplore} />
    </>
  );
}
