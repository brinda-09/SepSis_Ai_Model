import { useMemo, useState } from "react";

const WIDTH = 640;
const HEIGHT = 250;
const MARGIN = { top: 18, right: 20, bottom: 40, left: 58 };
const FEATURE_COUNT = 39;
const TIME_STEPS = 6;

function formatValue(value) {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function SequenceGraph({ sequence, features = [], patientId }) {
  const [selectedFeature, setSelectedFeature] = useState(10);
  const parsedSequence = useMemo(() => {
    try {
      const value = JSON.parse(sequence);
      if (
        Array.isArray(value) &&
        value.length === TIME_STEPS &&
        value.every(
          (row) =>
            Array.isArray(row) &&
            row.length === FEATURE_COUNT &&
            row.every((item) => typeof item === "number" && Number.isFinite(item))
        )
      ) {
        return value;
      }
    } catch {
      return null;
    }

    return null;
  }, [sequence]);

  const featureName =
    features[selectedFeature] || `Feature ${Number(selectedFeature) + 1}`;

  if (!parsedSequence) {
    return (
      <div className="sequence-graph-empty" role="status">
        Load a dataset patient to view the clinical data graph.
      </div>
    );
  }

  const values = parsedSequence.map((row) => row[selectedFeature]);
  const isStable = values.every((value) => value === values[0]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || Math.max(Math.abs(maxValue) * 0.1, 1);
  const chartMin = minValue - valueRange * 0.1;
  const chartMax = maxValue + valueRange * 0.1;
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const points = values.map((value, index) => ({
    x: MARGIN.left + (index / (TIME_STEPS - 1)) * plotWidth,
    y: MARGIN.top + ((chartMax - value) / (chartMax - chartMin)) * plotHeight,
    value,
  }));
  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <section className="sequence-graph" aria-label="Clinical time-series graph">
      <div className="sequence-graph-heading">
        <div>
          <strong>Clinical trend graph</strong>
          <span>
            {patientId ? `Loaded sample: ${patientId}` : "Updates from the loaded sample"}
          </span>
        </div>
        <label className="sequence-graph-selector">
          <span>Feature</span>
          <select
            value={selectedFeature}
            onChange={(event) => setSelectedFeature(Number(event.target.value))}
            aria-label="Select clinical feature to graph"
          >
            {Array.from({ length: FEATURE_COUNT }, (_, index) => (
              <option key={index} value={index}>
                {features[index] || `Feature ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="sequence-graph-chart">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`${featureName} values across six time steps`}
        >
          <text className="sequence-graph-axis-title" x="12" y="14">
            {featureName}
          </text>
          {Array.from({ length: 5 }, (_, index) => {
            const fraction = index / 4;
            const y = MARGIN.top + fraction * plotHeight;
            const value = chartMax - fraction * (chartMax - chartMin);
            return (
              <g key={index}>
                <line
                  className="sequence-graph-grid-line"
                  x1={MARGIN.left}
                  x2={WIDTH - MARGIN.right}
                  y1={y}
                  y2={y}
                />
                <text
                  className="sequence-graph-tick"
                  x={MARGIN.left - 8}
                  y={y + 4}
                  textAnchor="end"
                >
                  {formatValue(value)}
                </text>
              </g>
            );
          })}
          <polyline className="sequence-graph-line" points={linePoints} />
          {points.map(({ x, y, value }, index) => (
            <g key={index}>
              <circle className="sequence-graph-point" cx={x} cy={y} r="4">
                <title>
                  Time step {index + 1}: {formatValue(value)}
                </title>
              </circle>
              <text
                className="sequence-graph-tick"
                x={x}
                y={HEIGHT - 14}
                textAnchor="middle"
              >
                Hour {index + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="sequence-graph-values" aria-live="polite">
        {values.map((value, index) => (
          <div className="sequence-graph-value" key={`${selectedFeature}-${index}`}>
            <span>Hour {index + 1}</span>
            <strong>{formatValue(value)}</strong>
          </div>
        ))}
      </div>
      <p className="sequence-graph-trend" aria-live="polite">
        {isStable
          ? `${featureName} remained stable across these six time steps.`
          : `${featureName} changed across these six time steps.`}
      </p>
      <p className="sequence-graph-note">
        The chart shows the selected clinical feature across six hourly
        measurements.
      </p>
    </section>
  );
}

export default SequenceGraph;
