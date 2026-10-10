export default function BudgetSummary({ itinerary, total, groupSize, impact }) {
  const unknown = itinerary.filter((x) => x.pricePerPerson == null).length;
  const costPerPerson = itinerary.reduce((s, x) => s + (x.pricePerPerson ?? 0), 0);
  const cost = costPerPerson * groupSize;
  const mins = itinerary.reduce((s, x) => s + x.durationMinutes, 0);
  const pct = total > 0 ? Math.min(100, (cost / total) * 100) : 0;
  const remaining = total - cost;

  return (
    <div className="budget-card">
      <h3>Budget Overview</h3>

      <div className="budget-row">
        <span className="muted">Estimated cost</span>
        <span><b>₹{cost}</b></span>
      </div>
      <div className="budget-row">
        <span className="muted">Total budget</span>
        <span>₹{total}</span>
      </div>

      <div className="budget-bar">
        <div
          className={`budget-bar-fill ${remaining < 0 ? 'over' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="budget-row total">
        <span>Remaining</span>
        <span className={remaining < 0 ? 'err' : ''}>₹{remaining}</span>
      </div>

      <p className="muted" style={{ fontSize: '0.85rem', marginTop: 8 }}>
        Total activity time: {Math.floor(mins / 60)}h {mins % 60}m
        {unknown > 0 && ` · ${unknown} item(s) have unknown prices and aren't counted`}
      </p>

      <div className="impact-box">
        <h4>Local Impact Meter</h4>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Estimated spend at community providers:{' '}
          <b>₹{impact.communitySpend * groupSize}</b> across{' '}
          {impact.communityCount} experience{impact.communityCount !== 1 ? 's' : ''}.
        </p>
        <p className="muted" style={{ fontSize: '0.8rem', margin: '6px 0 0' }}>
          Estimate only — based on listed prices for community-run experiences. Not verified donations or impact claims.
        </p>
      </div>
    </div>
  );
}
