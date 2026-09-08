import './BarChart.css'

/**
 * Minimal, theme-aware bar chart built from plain divs (no chart library).
 * `orientation="vertical"` compares magnitude across categories (e.g. hours
 * per day/staff, single hue). `orientation="horizontal"` is for a short,
 * identity-colored breakdown (e.g. task status counts) -- pass a `color`
 * per data point to color by identity instead of magnitude.
 */
export default function BarChart({
  data,
  orientation = 'vertical',
  color = 'var(--primary)',
  formatValue = (v) => v,
  height = 180,
  emptyMessage = 'No data yet.',
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const hasData = data.some((d) => d.value > 0)

  if (!hasData) {
    return (
      <div className="chart-empty" style={orientation === 'vertical' ? { height } : undefined}>
        {emptyMessage}
      </div>
    )
  }

  if (orientation === 'horizontal') {
    return (
      <div className="chart-bars-horizontal">
        {data.map((d) => {
          const pct = Math.max(d.value > 0 ? 3 : 0, (d.value / max) * 100)
          return (
            <div className="chart-bar-row-h" key={d.label}>
              <span className="chart-bar-label-h">{d.label}</span>
              <div className="chart-track-h" title={`${d.label}: ${formatValue(d.value)}`}>
                <div
                  className="chart-fill-h"
                  style={{ width: `${pct}%`, background: d.color || color }}
                />
              </div>
              <span className="chart-value-h">{formatValue(d.value)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const showLabels = data.length <= 8

  return (
    <div className="chart-bars-vertical" style={{ height }}>
      {data.map((d) => {
        const pct = Math.max(d.value > 0 ? 2 : 0, (d.value / max) * 100)
        return (
          <div className="chart-bar-col" key={d.label}>
            {showLabels && d.value > 0 && (
              <span className="chart-bar-value-v">{formatValue(d.value)}</span>
            )}
            <div className="chart-bar-track-v">
              <div
                className="chart-bar-v"
                style={{ height: `${pct}%`, background: d.color || color }}
                title={`${d.label}: ${formatValue(d.value)}`}
              />
            </div>
            <span className="chart-bar-label-v">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}
