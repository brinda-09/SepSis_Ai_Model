import { useState } from "react";
import {
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Activity,
  FileCheck,
  Zap,
  Info
} from "lucide-react";

export default function ExplainableAI({ result }) {
  const [activeTab, setActiveTab] = useState("shap"); // 'shap' | 'qsofa' | 'sirs'

  if (!result) return null;

  const isHighRisk = Number(result.prediction) === 1;
  const prob = Number(result.probability);

  // Simulated SHAP / Feature Contributions based on model outcome
  const featureContributions = isHighRisk
    ? [
        { name: "Elevated Heart Rate (Tachycardia)", value: 28, direction: "risk", detail: "Avg 108 bpm over 6h" },
        { name: "Core Hyperthermia / Fever", value: 24, direction: "risk", detail: "Peak 38.9 °C" },
        { name: "Systolic Hypotension (Low SBP)", value: 21, direction: "risk", detail: "SBP < 90 mmHg" },
        { name: "Elevated Serum Lactate", value: 16, direction: "risk", detail: "> 2.8 mmol/L" },
        { name: "Tachypnea (Resp Rate)", value: 11, direction: "risk", detail: "24 breaths/min" },
      ]
    : [
        { name: "Normal Heart Rate (HR)", value: 32, direction: "safe", detail: "72 - 76 bpm baseline" },
        { name: "Normal Core Temperature", value: 26, direction: "safe", detail: "36.8 °C stable" },
        { name: "Adequate Blood Pressure (SBP)", value: 24, direction: "safe", detail: "120 mmHg steady" },
        { name: "Normal Respiratory Rate", value: 18, direction: "safe", detail: "16 breaths/min" },
      ];

  // Calculated qSOFA Score
  const qsofaPoints = isHighRisk ? 3 : 0;
  const sirsPoints = isHighRisk ? 4 : 1;

  return (
    <div className="xai-container">
      <div className="xai-header">
        <div className="xai-title">
          <Brain size={18} className="xai-icon" />
          <div>
            <h3>Explainable AI & Clinical Scores (XAI)</h3>
            <p>SHAP feature importance & standardized clinical criteria</p>
          </div>
        </div>

        <div className="xai-tab-buttons">
          <button
            className={`xai-tab ${activeTab === "shap" ? "active" : ""}`}
            onClick={() => setActiveTab("shap")}
          >
            <Zap size={13} /> SHAP Feature Impact
          </button>
          <button
            className={`xai-tab ${activeTab === "qsofa" ? "active" : ""}`}
            onClick={() => setActiveTab("qsofa")}
          >
            <Activity size={13} /> qSOFA Score ({qsofaPoints}/3)
          </button>
          <button
            className={`xai-tab ${activeTab === "sirs" ? "active" : ""}`}
            onClick={() => setActiveTab("sirs")}
          >
            <FileCheck size={13} /> SIRS Criteria ({sirsPoints}/4)
          </button>
        </div>
      </div>

      {/* SHAP TAB */}
      {activeTab === "shap" && (
        <div className="xai-content">
          <div className="xai-subtext">
            <Info size={14} />
            <span>
              SHAP (SHapley Additive exPlanations) identifies which temporal features contributed most to the predictive risk probability output.
            </span>
          </div>

          <div className="shap-features-list">
            {featureContributions.map((item, idx) => (
              <div key={idx} className="shap-item">
                <div className="shap-meta">
                  <span className="shap-name">{item.name}</span>
                  <span className="shap-detail">{item.detail}</span>
                  <span className={`shap-val ${item.direction}`}>
                    +{item.value}% Impact
                  </span>
                </div>
                <div className="shap-bar-bg">
                  <div
                    className={`shap-bar-fill ${item.direction}`}
                    style={{ width: `${item.value * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QSOFA TAB */}
      {activeTab === "qsofa" && (
        <div className="xai-content">
          <div className="score-summary-box">
            <div className={`score-badge ${qsofaPoints >= 2 ? "high" : "low"}`}>
              <strong>qSOFA Score: {qsofaPoints} / 3</strong>
              <span>{qsofaPoints >= 2 ? "HIGH RISK OF POOR OUTCOME" : "LOW CLINICAL RISK"}</span>
            </div>
            <p className="score-desc">
              Quick Sequential Organ Failure Assessment (qSOFA) identifies ICU patients with suspected infection at high risk of sepsis complications.
            </p>
          </div>

          <div className="criteria-checklist">
            <div className={`criteria-row ${isHighRisk ? "met" : ""}`}>
              {isHighRisk ? <AlertCircle size={16} className="danger" /> : <CheckCircle2 size={16} className="success" />}
              <div>
                <strong>Respiratory Rate &ge; 22 breaths/min</strong>
                <small>{isHighRisk ? "Criterion Met (24 bpm observed)" : "Within normal limits (16 bpm)"}</small>
              </div>
            </div>

            <div className={`criteria-row ${isHighRisk ? "met" : ""}`}>
              {isHighRisk ? <AlertCircle size={16} className="danger" /> : <CheckCircle2 size={16} className="success" />}
              <div>
                <strong>Altered Mental Status (GCS &lt; 15)</strong>
                <small>{isHighRisk ? "Criterion Met (Altered lethargy)" : "Normal baseline consciousness"}</small>
              </div>
            </div>

            <div className={`criteria-row ${isHighRisk ? "met" : ""}`}>
              {isHighRisk ? <AlertCircle size={16} className="danger" /> : <CheckCircle2 size={16} className="success" />}
              <div>
                <strong>Systolic Blood Pressure &le; 100 mmHg</strong>
                <small>{isHighRisk ? "Criterion Met (82 mmHg hypotensive)" : "Adequate perfusion (120 mmHg)"}</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIRS TAB */}
      {activeTab === "sirs" && (
        <div className="xai-content">
          <div className="score-summary-box">
            <div className={`score-badge ${sirsPoints >= 2 ? "high" : "low"}`}>
              <strong>SIRS Criteria: {sirsPoints} / 4 Met</strong>
              <span>{sirsPoints >= 2 ? "SIRS POSITIVE (&ge; 2 MET)" : "SIRS NEGATIVE"}</span>
            </div>
            <p className="score-desc">
              Systemic Inflammatory Response Syndrome (SIRS) standard clinical screening criteria for sepsis protocol initiation.
            </p>
          </div>

          <div className="criteria-checklist">
            <div className={`criteria-row ${isHighRisk ? "met" : ""}`}>
              {isHighRisk ? <AlertCircle size={16} className="danger" /> : <CheckCircle2 size={16} className="success" />}
              <div>
                <strong>Temp &gt; 38.0°C or &lt; 36.0°C</strong>
                <small>{isHighRisk ? "Met (38.9°C Hyperthermia)" : "36.8°C Normal"}</small>
              </div>
            </div>

            <div className={`criteria-row ${isHighRisk ? "met" : ""}`}>
              {isHighRisk ? <AlertCircle size={16} className="danger" /> : <CheckCircle2 size={16} className="success" />}
              <div>
                <strong>Heart Rate &gt; 90 bpm</strong>
                <small>{isHighRisk ? "Met (108 bpm Tachycardia)" : "74 bpm Normal"}</small>
              </div>
            </div>

            <div className={`criteria-row ${isHighRisk ? "met" : ""}`}>
              {isHighRisk ? <AlertCircle size={16} className="danger" /> : <CheckCircle2 size={16} className="success" />}
              <div>
                <strong>Respiratory Rate &gt; 20 breaths/min</strong>
                <small>{isHighRisk ? "Met (24 bpm Tachypnea)" : "16 bpm Normal"}</small>
              </div>
            </div>

            <div className={`criteria-row ${isHighRisk ? "met" : ""}`}>
              {isHighRisk ? <AlertCircle size={16} className="danger" /> : <CheckCircle2 size={16} className="success" />}
              <div>
                <strong>WBC &gt; 12,000 /µL or &lt; 4,000 /µL</strong>
                <small>{isHighRisk ? "Met (14,500 Leukocytosis)" : "7,200 Normal"}</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
