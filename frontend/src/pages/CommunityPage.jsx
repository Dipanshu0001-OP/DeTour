import PlaceCard from '../components/PlaceCard.jsx';
import { getAllPlaces } from '../services/api.js';
import { BadgeCheck } from 'lucide-react';

export default function CommunityPage({ onAdd, itinerary }) {
  const list = getAllPlaces().filter((p) => p.community?.isCommunityRun);

  return (
    <>
      <section className="community-hero">
        <div className="wrap">
          <h1>Community Passport</h1>
          <p>
            Artisans, food makers and community-run experiences. We label verification status
            honestly — “Unverified” means we have not independently confirmed the provider.
          </p>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 60 }}>
        {list.length === 0 ? (
          <div className="state-box">
            <h3>No community providers listed yet</h3>
            <p>Check back as the dataset grows.</p>
          </div>
        ) : (
          <div className="grid">
            {list.map((p) => (
              <div key={p.id} className="provider-card">
                <span className="type-badge">
                  {p.community.providerType || 'Community'}
                </span>
                <h3>{p.community.providerName || p.name}</h3>
                <p className="muted" style={{ fontSize: '0.9rem' }}>{p.description}</p>

                <div className="chips" style={{ margin: '12px 0' }}>
                  <span className="tag">
                    {p.community.verified ? (
                      <><BadgeCheck size={12} /> Verified</>
                    ) : (
                      'Unverified'
                    )}
                  </span>
                  {p.dataSource === 'demo' && <span className="tag">Demo listing</span>}
                  {p.pricePerPerson != null && (
                    <span className="tag">
                      {p.pricePerPerson === 0 ? 'Free' : `From ₹${p.pricePerPerson}`}
                    </span>
                  )}
                </div>

                <PlaceCard
                  p={p}
                  added={itinerary.some((x) => x.id === p.id)}
                  onAdd={onAdd}
                />

                {(p.community.contactUrl || p.locationUrl) && (
                  <p style={{ marginTop: 12, fontSize: '0.9rem' }}>
                    {p.community.contactUrl && (
                      <a href={p.community.contactUrl} target="_blank" rel="noreferrer">
                        Contact
                      </a>
                    )}
                    {p.locationUrl && (
                      <>
                        {p.community.contactUrl ? ' · ' : ''}
                        <a href={p.locationUrl} target="_blank" rel="noreferrer">
                          Location
                        </a>
                      </>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
