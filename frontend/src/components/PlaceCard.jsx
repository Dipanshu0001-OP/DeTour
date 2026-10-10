import { Clock, IndianRupee, BadgeCheck, Plus, Check, MapPin } from 'lucide-react';

export const formatPrice = (p) => {
  if (p.pricePerPerson == null) return 'Price unknown';
  if (p.pricePerPerson === 0) return 'Free';
  return `₹${p.pricePerPerson}`;
};

export default function PlaceCard({ p, added, onAdd }) {
  const c = p.community;

  return (
    <article className="card place-card">
      <div className="card-top">
        <h3>{p.name}</h3>
        {p.matchScore != null && (
          <span className="score">{Math.round(p.matchScore * 100)}%</span>
        )}
      </div>

      {p.city && (
        <p className="meta" style={{ marginBottom: 6 }}>
          <span><MapPin size={13} /> {p.city}</span>
        </p>
      )}

      <p className="desc">{p.description}</p>

      <div className="meta">
        <span><Clock size={14} /> {p.durationMinutes} min</span>
        <span>
          <IndianRupee size={14} /> {formatPrice(p)}
          {p.priceIsEstimate && p.pricePerPerson != null ? ' (est.)' : ''}
        </span>
      </div>

      <div className="chips">
        {p.tags?.includes('hidden-gem') && <span className="tag gem">Hidden gem</span>}
        {c?.isCommunityRun && (
          <span className="tag terra">Community · {c.providerType}</span>
        )}
        {c?.isCommunityRun && (
          <span className="tag">
            {c.verified ? (
              <><BadgeCheck size={12} /> Verified</>
            ) : (
              'Unverified'
            )}
          </span>
        )}
        {p.dataSource === 'demo' && <span className="tag">Demo listing</span>}
      </div>

      {p.reasons?.length > 0 && (
        <div className="why">{p.reasons[0]}</div>
      )}

      {onAdd && (
        <div className="actions">
          <button
            className="btn small"
            disabled={added}
            onClick={() => onAdd(p)}
          >
            {added ? (
              <><Check size={14} /> Added</>
            ) : (
              <><Plus size={14} /> Add to DeTour</>
            )}
          </button>
        </div>
      )}
    </article>
  );
}
