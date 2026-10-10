import { Compass, ListChecks, Users, Home, Route } from 'lucide-react';

export default function Navbar({ page, onGo, count }) {
  const tabs = [
    ['home', Home, 'Explore'],
    ['results', Compass, 'Results'],
    ['itinerary', ListChecks, 'My DeTour'],
    ['community', Users, 'Passport'],
  ];

  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => onGo('home')} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onGo('home')}>
        <Route size={22} strokeWidth={1.8} />
        DeTour
      </div>
      <div className="nav-tabs">
        {tabs.map(([key, Icon, label]) => (
          <button
            key={key}
            className={page === key ? 'on' : ''}
            onClick={() => onGo(key)}
            aria-current={page === key ? 'page' : undefined}
          >
            <Icon size={16} />
            <span>{label}</span>
            {key === 'itinerary' && count > 0 && (
              <span className="nav-badge">{count}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
