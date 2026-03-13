import type { LeaderboardEntry, PlayerSummary } from '../types/leaderboard';

type LeaderboardPanelProps = {
  title?: string;
  entries: LeaderboardEntry[];
  me: PlayerSummary | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
};

export function LeaderboardPanel({
  title = 'Global Leaderboard',
  entries,
  me,
  loading = false,
  error = null,
  className = '',
}: LeaderboardPanelProps) {
  return (
    <section className={`leaderboard-panel ${className}`.trim()}>
      <div className="leaderboard-panel-header">
        <div className="leaderboard-title">{title}</div>
        {me && (
          <div className="leaderboard-subtitle">Your Rank #{me.rank}</div>
        )}
      </div>

      {loading ? (
        <p className="leaderboard-status">Loading leaderboard…</p>
      ) : error ? (
        <p className="leaderboard-error">{error}</p>
      ) : (
        <div className="leaderboard-table-scroll">
          <div className="leaderboard-table">
            <div className="leaderboard-row leaderboard-row--head">
              <span>#</span>
              <span>Name</span>
              <span>Deals</span>
              <span>Gross</span>
              <span>Profit</span>
              <span>Best Volume</span>
            </div>
            {entries.length === 0 && (
              <div className="leaderboard-row leaderboard-row--empty">No leaderboard data yet.</div>
            )}
            {entries.map((entry, index) => (
              <div
                key={entry.uid}
                className={`leaderboard-row ${entry.uid === me?.uid ? 'leaderboard-row--self' : ''}`}
              >
                <span className="leaderboard-rank">{entry.rank ?? index + 1}</span>
                <span className="leaderboard-name">{entry.displayName}</span>
                <span className="leaderboard-sales">{entry.salesCount}</span>
                <span className="leaderboard-gross">${entry.totalGross.toLocaleString()}</span>
                <span className="leaderboard-profit">${entry.totalProfit.toLocaleString()}</span>
                <span className="leaderboard-volume">
                  {entry.bestVolumeProfit > 0 ? `$${entry.bestVolumeProfit.toLocaleString()}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {me && me.lastSessionProfit !== undefined && (
        <div className="leaderboard-footer">
          <p>
            Last session: {me.lastSessionSales ?? '0'} deals • ${me.lastSessionProfit.toLocaleString()}
            {me.lastSessionAt && ` • ${new Date(me.lastSessionAt).toLocaleDateString()}`}
          </p>
        </div>
      )}
    </section>
  );
}
