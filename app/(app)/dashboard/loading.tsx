export default function DashboardLoading() {
  return (
    <main
      className="soy-dashboard-shell dashboard-skeleton"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      {/* Header skeleton */}
      <div className="dashboard-skeleton__header">
        <div>
          <div className="skeleton-shimmer skeleton-title" />
          <div className="skeleton-shimmer skeleton-subtitle" />
        </div>

        <div className="skeleton-shimmer skeleton-date" />
      </div>

      {/* Main dashboard skeleton */}
      <div className="dashboard-skeleton__grid">
        {/* Large hero card */}
        <div className="dashboard-skeleton__hero">
          <div className="skeleton-shimmer skeleton-eyebrow" />
          <div className="skeleton-shimmer skeleton-hero-title" />
          <div className="skeleton-shimmer skeleton-hero-text" />

          <div className="dashboard-skeleton__track">
            {Array.from({ length: 18 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        </div>

        {/* Right cards */}
        <div className="dashboard-skeleton__side">
          <div className="dashboard-skeleton__side-card">
            <div className="skeleton-shimmer skeleton-small-title" />
            <div className="skeleton-shimmer skeleton-medium-line" />
            <div className="skeleton-shimmer skeleton-long-line" />
            <div className="skeleton-shimmer skeleton-button" />
          </div>

          <div className="dashboard-skeleton__side-card">
            <div className="skeleton-shimmer skeleton-small-title" />

            {Array.from({ length: 3 }).map((_, index) => (
              <div className="dashboard-skeleton__user" key={index}>
                <div className="skeleton-shimmer skeleton-avatar" />

                <div>
                  <div className="skeleton-shimmer skeleton-user-name" />
                  <div className="skeleton-shimmer skeleton-user-xp" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower chart cards */}
      <div className="dashboard-skeleton__charts">
        <div className="dashboard-skeleton__chart-card">
          <div className="skeleton-shimmer skeleton-chart-title" />

          <div className="dashboard-skeleton__bars">
            {[65, 40, 75, 48, 85, 55, 70].map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>

        <div className="dashboard-skeleton__chart-card">
          <div className="skeleton-shimmer skeleton-chart-title" />

          <div className="dashboard-skeleton__circle" />
        </div>
      </div>

      {/* Bottom loading status */}
      <div className="dashboard-skeleton__status">
        <div className="dashboard-skeleton__status-top">
          <div className="dashboard-skeleton__status-icon">↻</div>

          <div>
            <strong>Loading your dashboard</strong>
            <span>Please wait while we fetch your data...</span>
          </div>
        </div>

        <div className="dashboard-skeleton__progress">
          <span />
        </div>
      </div>
    </main>
  );
}