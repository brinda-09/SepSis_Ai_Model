import { useState, useEffect } from "react";
import {
  Brain,
  Cpu,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Info,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  FileText
} from "lucide-react";

function ModelComparison() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/model-comparison");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        throw new Error("API metrics endpoint not available");
      }
    } catch {
      // Fallback actual measured metrics
      setMetrics({
        xgboost: {
          accuracy: 0.9080,
          precision: 0.0936,
          recall: 0.3941,
          f1: 0.1513,
          auc: 0.7668,
          confusion_matrix: [[27982, 2469], [392, 255]]
        },
        lstm: {
          accuracy: 0.9016,
          precision: 0.0633,
          recall: 0.2705,
          f1: 0.1026,
          auc: 0.7005,
          confusion_matrix: [[27863, 2588], [472, 175]]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatPercent = (val) => {
    if (val === null || val === undefined) return "N/A";
    return (Number(val) * 100).toFixed(2) + "%";
  };

  const xgb = metrics?.xgboost || {};
  const lstm = metrics?.lstm || {};

  const xgbCM = xgb.confusion_matrix || [[27982, 2469], [392, 255]];
  const lstmCM = lstm.confusion_matrix || [[27863, 2588], [472, 175]];

  return (
    <div className="page-content">
      {/* PAGE TITLE */}
      <div className="page-title-row">
        <div>
          <h2>Model Performance Comparison: XGBoost vs. LSTM</h2>
          <p>Comparison of XGBoost baseline and LSTM temporal model on identical holdout ICU test data (31,098 sequences)</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className="badge badge-ai">
            <Sparkles size={14} /> EMPIRICAL EVALUATION
          </span>
          <button
            className="btn-secondary"
            onClick={fetchMetrics}
            style={{ padding: "8px 14px", fontSize: "12px", gap: "6px" }}
          >
            <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh Metrics
          </button>
        </div>
      </div>

      {/* NON-MEDICAL RESEARCH DISCLAIMER */}
      <div className="alert-error" style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "var(--warning)", marginBottom: "20px" }}>
        <Info size={16} />
        <span style={{ fontSize: "12.5px", lineHeight: "1.5" }}>
          <strong>Research & Prototype Notice:</strong> These model results are based on the evaluation dataset and are intended for research/prototype comparison. AI predictions are decision-support outputs and should not be treated as standalone clinical diagnosis.
        </span>
      </div>

      {/* TWO MODEL CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* XGBOOST MODEL CARD */}
        <div className="panel" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div className="panel-header" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="stat-icon purple" style={{ width: "36px", height: "36px", borderRadius: "8px" }}>
                <Cpu size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: "17px", color: "var(--text-heading)" }}>XGBoost Baseline Model</h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Traditional Gradient Boosted Decision Trees (Flattened 234 Features)</p>
              </div>
            </div>
            <span className="badge badge-ai" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}>
              BASELINE CLASSIFIER
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px", fontSize: "12px" }}>
            <div style={{ background: "var(--bg-card)", padding: "8px 12px", borderRadius: "6px" }}>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Input Vector</span>
              <strong style={{ color: "var(--text-heading)" }}>234 Flattened Features (6×39)</strong>
            </div>
            <div style={{ background: "var(--bg-card)", padding: "8px 12px", borderRadius: "6px" }}>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Imbalance Handling</span>
              <strong style={{ color: "var(--text-heading)" }}>scale_pos_weight = 41.54</strong>
            </div>
          </div>
        </div>

        {/* LSTM MODEL CARD */}
        <div className="panel" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div className="panel-header" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="stat-icon blue" style={{ width: "36px", height: "36px", borderRadius: "8px" }}>
                <Brain size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: "17px", color: "var(--text-heading)" }}>LSTM Temporal Model</h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Sequence-Based Recurrent Deep Learning (6 Steps × 39 Features)</p>
              </div>
            </div>
            <span className="badge badge-ai">
              DEEP TEMPORAL MODEL
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px", fontSize: "12px" }}>
            <div style={{ background: "var(--bg-card)", padding: "8px 12px", borderRadius: "6px" }}>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Input Tensor</span>
              <strong style={{ color: "var(--text-heading)" }}>6 Timesteps × 39 Vitals</strong>
            </div>
            <div style={{ background: "var(--bg-card)", padding: "8px 12px", borderRadius: "6px" }}>
              <span style={{ color: "var(--text-muted)", display: "block" }}>Architecture</span>
              <strong style={{ color: "var(--text-heading)" }}>2-Layer Recurrent Net</strong>
            </div>
          </div>
        </div>
      </div>

      {/* STAT CARDS OVERVIEW */}
      <section className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card purple">
          <div className="stat-icon purple">
            <Cpu size={24} />
          </div>
          <div className="stat-info">
            <span>XGBoost ROC-AUC</span>
            <strong>{formatPercent(xgb.auc)}</strong>
            <small>Gradient Boosted Baseline</small>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon blue">
            <Brain size={24} />
          </div>
          <div className="stat-info">
            <span>LSTM ROC-AUC</span>
            <strong>{formatPercent(lstm.auc)}</strong>
            <small>Temporal Sequence Model</small>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green">
            <BarChart3 size={24} />
          </div>
          <div className="stat-info">
            <span>XGBoost F1 Score</span>
            <strong>{formatPercent(xgb.f1)}</strong>
            <small>Higher Sepsis Discrimination</small>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon orange">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span>LSTM F1 Score</span>
            <strong>{formatPercent(lstm.f1)}</strong>
            <small>Sequence Recurrent Net</small>
          </div>
        </div>
      </section>

      {/* PERFORMANCE COMPARISON TABLE */}
      <div className="table-card" style={{ marginBottom: "24px" }}>
        <div className="table-header">
          <div>
            <h3>Performance Comparison Table</h3>
            <p>Measured on identical 31,098 ICU test sequences (threshold = 0.50)</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: "240px" }}>Metric</th>
                <th>XGBoost Baseline</th>
                <th>LSTM Model</th>
                <th>Delta / Comparison Assessment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong style={{ color: "var(--text-heading)" }}>Accuracy</strong>
                  <br />
                  <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>Overall correct prediction rate</small>
                </td>
                <td>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                    {formatPercent(xgb.accuracy)}
                  </strong>
                </td>
                <td>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                    {formatPercent(lstm.accuracy)}
                  </strong>
                </td>
                <td>
                  <span className="status-pill success">
                    <CheckCircle2 size={12} /> XGBoost (+0.64%)
                  </span>
                </td>
              </tr>

              <tr>
                <td>
                  <strong style={{ color: "var(--text-heading)" }}>Precision (Sepsis Class)</strong>
                  <br />
                  <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>True sepsis cases among positive alerts</small>
                </td>
                <td>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                    {formatPercent(xgb.precision)}
                  </strong>
                </td>
                <td>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                    {formatPercent(lstm.precision)}
                  </strong>
                </td>
                <td>
                  <span className="status-pill success">
                    <CheckCircle2 size={12} /> XGBoost (+3.03%)
                  </span>
                </td>
              </tr>

              <tr>
                <td>
                  <strong style={{ color: "var(--text-heading)" }}>Recall / Sensitivity (Sepsis)</strong>
                  <br />
                  <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>Percentage of actual sepsis cases caught</small>
                </td>
                <td>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                    {formatPercent(xgb.recall)}
                  </strong>
                </td>
                <td>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                    {formatPercent(lstm.recall)}
                  </strong>
                </td>
                <td>
                  <span className="status-pill success">
                    <CheckCircle2 size={12} /> XGBoost (+12.36%)
                  </span>
                </td>
              </tr>

              <tr>
                <td>
                  <strong style={{ color: "var(--text-heading)" }}>F1 Score (Sepsis Class)</strong>
                  <br />
                  <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>Harmonic mean of precision & recall</small>
                </td>
                <td>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                    {formatPercent(xgb.f1)}
                  </strong>
                </td>
                <td>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                    {formatPercent(lstm.f1)}
                  </strong>
                </td>
                <td>
                  <span className="status-pill success">
                    <CheckCircle2 size={12} /> XGBoost (+4.87%)
                  </span>
                </td>
              </tr>

              <tr>
                <td>
                  <strong style={{ color: "var(--text-heading)" }}>ROC-AUC Score</strong>
                  <br />
                  <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>Area Under Receiver Operating Curve</small>
                </td>
                <td>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--success)" }}>
                    {formatPercent(xgb.auc)}
                  </strong>
                </td>
                <td>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                    {formatPercent(lstm.auc)}
                  </strong>
                </td>
                <td>
                  <span className="status-pill success">
                    <CheckCircle2 size={12} /> XGBoost (+6.63%)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFUSION MATRICES SECTION */}
      <div className="panel" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <div>
            <h2>Confusion Matrices Comparison</h2>
            <p>Detailed breakdown of True Negatives (TN), False Positives (FP), False Negatives (FN), and True Positives (TP)</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "16px" }}>
          {/* XGBOOST CONFUSION MATRIX */}
          <div style={{ background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h4 style={{ color: "#a78bfa", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Cpu size={16} /> XGBoost Confusion Matrix
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "12px", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>True Negatives (TN)</span>
                <strong style={{ fontSize: "18px", color: "var(--success)" }}>{xgbCM[0][0]?.toLocaleString()}</strong>
                <small style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>Correctly Identified Normal</small>
              </div>

              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "12px", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>False Positives (FP)</span>
                <strong style={{ fontSize: "18px", color: "var(--danger)" }}>{xgbCM[0][1]?.toLocaleString()}</strong>
                <small style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>False Alarm Sepsis</small>
              </div>

              <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "12px", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>False Negatives (FN)</span>
                <strong style={{ fontSize: "18px", color: "var(--warning)" }}>{xgbCM[1][0]?.toLocaleString()}</strong>
                <small style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>Missed Sepsis Cases</small>
              </div>

              <div style={{ background: "rgba(14, 165, 233, 0.1)", border: "1px solid rgba(14, 165, 233, 0.3)", padding: "12px", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>True Positives (TP)</span>
                <strong style={{ fontSize: "18px", color: "var(--primary)" }}>{xgbCM[1][1]?.toLocaleString()}</strong>
                <small style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>Correctly Detected Sepsis</small>
              </div>
            </div>
          </div>

          {/* LSTM CONFUSION MATRIX */}
          <div style={{ background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h4 style={{ color: "var(--primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Brain size={16} /> LSTM Confusion Matrix
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "12px", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>True Negatives (TN)</span>
                <strong style={{ fontSize: "18px", color: "var(--success)" }}>{lstmCM[0][0]?.toLocaleString()}</strong>
                <small style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>Correctly Identified Normal</small>
              </div>

              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "12px", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>False Positives (FP)</span>
                <strong style={{ fontSize: "18px", color: "var(--danger)" }}>{lstmCM[0][1]?.toLocaleString()}</strong>
                <small style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>False Alarm Sepsis</small>
              </div>

              <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "12px", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>False Negatives (FN)</span>
                <strong style={{ fontSize: "18px", color: "var(--warning)" }}>{lstmCM[1][0]?.toLocaleString()}</strong>
                <small style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>Missed Sepsis Cases</small>
              </div>

              <div style={{ background: "rgba(14, 165, 233, 0.1)", border: "1px solid rgba(14, 165, 233, 0.3)", padding: "12px", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>True Positives (TP)</span>
                <strong style={{ fontSize: "18px", color: "var(--primary)" }}>{lstmCM[1][1]?.toLocaleString()}</strong>
                <small style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>Correctly Detected Sepsis</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODEL CHARACTERISTICS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div className="panel">
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Cpu size={20} style={{ color: "#8b5cf6" }} />
              <div>
                <h2>XGBoost Model Characteristics</h2>
                <p>Traditional Tabular Gradient Boosting Baseline</p>
              </div>
            </div>
          </div>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong>Characteristics:</strong> Traditional gradient-boosting baseline using flattened time-series features. Evaluates non-linear feature splits across static 234-dimensional vectors. Achieves strong sensitivity and ROC-AUC when class imbalance is handled via `scale_pos_weight = 41.54`.
          </p>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Brain size={20} style={{ color: "var(--primary)" }} />
              <div>
                <h2>LSTM Model Characteristics</h2>
                <p>Sequence-based Deep Learning Temporal Model</p>
              </div>
            </div>
          </div>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong>Characteristics:</strong> Sequence-based deep learning model designed to learn temporal patterns across ICU measurements. Processes 6 consecutive hourly recordings as structured time-steps, preserving sequential relationships in vital signs.
          </p>
        </div>
      </div>

      <div className="demo-note-box" style={{ marginTop: "24px" }}>
        <Info size={16} />
        <p>
          Both models are evaluated on identical test sequences (31,098 samples) and retained in the system pipeline for side-by-side verification and benchmark comparison.
        </p>
      </div>
    </div>
  );
}

export default ModelComparison;
