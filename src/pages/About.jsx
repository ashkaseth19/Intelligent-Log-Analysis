import React from 'react';
import {
  Users,
  Database,
  Sliders,
  Cpu,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';

export const About = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-2">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Intelligent Log Analysis and Threat Detection
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Final Year Capstone Project in Computer Science and Information Security
        </p>
      </div>

      {/* 1. Team & Guide Placeholders Box */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Users className="w-4 h-4 text-blue-600" />
          <span>Project Team & Guidance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-700 block">Student Contributors:</span>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex justify-between">
                <span>[Student 1 Name]</span>
                <span className="font-mono text-slate-500">[Roll No. / ID]</span>
              </li>
              <li className="flex justify-between">
                <span>[Student 2 Name]</span>
                <span className="font-mono text-slate-500">[Roll No. / ID]</span>
              </li>
              <li className="flex justify-between">
                <span>[Student 3 Name]</span>
                <span className="font-mono text-slate-500">[Roll No. / ID]</span>
              </li>
            </ul>
            <div className="pt-2 border-t border-slate-100 text-slate-500">
              Department of Computer Science & Engineering
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-700 block">Faculty Supervision:</span>
            <p className="text-slate-800 font-medium">[Project Guide / Supervisor Name]</p>
            <p className="text-slate-600">[Designation / Assistant Professor]</p>
            <p className="text-slate-500">Department of Computer Science & Engineering</p>
            <div className="pt-2 border-t border-slate-100 text-slate-500">
              Academic Session: 2024 – 2025
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dataset Overview */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          Dataset Overview
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The research is evaluated against <code className="text-slate-800 font-mono">cybersecurity_threat_detection_logs.csv</code>, comprising <strong>6,000,000 log records (~874 MB)</strong> collected across application servers, network firewalls, and intrusion detection systems (IDS).
        </p>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                <th className="p-2.5">Field</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Description & Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-2.5 font-mono font-medium text-slate-900">timestamp</td>
                <td className="p-2.5 text-slate-500 font-mono">DateTime</td>
                <td className="p-2.5">ISO formatted timestamp of event entry (2024-01-01 to 2024-12-31)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-medium text-slate-900">source_ip</td>
                <td className="p-2.5 text-slate-500 font-mono">String</td>
                <td className="p-2.5">Originating IPv4 address initiating traffic (e.g., 187.14.173.168)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-medium text-slate-900">dest_ip</td>
                <td className="p-2.5 text-slate-500 font-mono">String</td>
                <td className="p-2.5">Destination internal IPv4 address (e.g., 192.168.1.78)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-medium text-slate-900">protocol</td>
                <td className="p-2.5 text-slate-500 font-mono">Categorical</td>
                <td className="p-2.5">Network protocol: TCP, HTTP, HTTPS, UDP, ICMP, SSH, FTP</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-medium text-slate-900">action</td>
                <td className="p-2.5 text-slate-500 font-mono">Categorical</td>
                <td className="p-2.5">Perimeter policy disposition: &apos;allowed&apos; or &apos;blocked&apos;</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-medium text-slate-900">log_type</td>
                <td className="p-2.5 text-slate-500 font-mono">Categorical</td>
                <td className="p-2.5">Ingestion telemetry source: application, ids, or firewall</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-medium text-slate-900">bytes_transferred</td>
                <td className="p-2.5 text-slate-500 font-mono">Integer</td>
                <td className="p-2.5">Payload transfer volume in bytes (log-transformed during preprocessing)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-medium text-slate-900">user_agent</td>
                <td className="p-2.5 text-slate-500 font-mono">String</td>
                <td className="p-2.5">HTTP client User-Agent header (browsers vs scanner tooling like sqlmap)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-medium text-slate-900">request_path</td>
                <td className="p-2.5 text-slate-500 font-mono">String</td>
                <td className="p-2.5">Target endpoint URI including query arguments (/api/login?DROP TABLE)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono font-medium text-slate-900">threat_label</td>
                <td className="p-2.5 text-slate-500 font-mono">Target Class</td>
                <td className="p-2.5">Supervised ground truth: &apos;benign&apos; (91.96%), &apos;suspicious&apos; (6.01%), &apos;malicious&apos; (2.03%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Preprocessing & Feature Engineering */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          Data Preprocessing & Feature Engineering
        </h2>
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            Raw log files undergo a deterministic transformation pipeline before model inference:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Missing Value Imputation:</strong> String columns are coerced to lower-case with empty defaults; null bytes transferred default to 0.
            </li>
            <li>
              <strong>Log Transformation:</strong> The <code className="text-slate-800 font-mono">bytes_transferred</code> feature spans several orders of magnitude; we apply <code className="text-slate-800 font-mono">np.log1p(bytes)</code> to stabilize gradient variance.
            </li>
            <li>
              <strong>Categorical Encoding:</strong> One-hot encoding is applied to <code className="text-slate-800 font-mono">protocol</code> and <code className="text-slate-800 font-mono">log_type</code>; binary encoding is mapped to <code className="text-slate-800 font-mono">action</code> (allowed = 1, blocked = 0).
            </li>
            <li>
              <strong>URI Signature Extraction:</strong> Request paths are tokenized into indicator flags for high-risk exploit tokens including <code className="text-slate-800 font-mono">phpmyadmin</code>, <code className="text-slate-800 font-mono">sql</code>, <code className="text-slate-800 font-mono">admin</code>, <code className="text-slate-800 font-mono">passwd</code>, and <code className="text-slate-800 font-mono">backup</code>.
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Train / Test Methodology */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          Model Training & Evaluation Methodology
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Due to memory constraints of training across 6,000,000 records simultaneously, models are trained on a <strong>100,000-record uniform sample</strong> preserving original class proportions. An <strong>80 / 20 stratified split</strong> (random_state=42) produces 80,000 training logs and 20,000 evaluation logs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-900 block">Random Forest</span>
            <p className="text-slate-600 mt-1">100 decision trees, balanced class weights, Gini impurity criterion. Achieves 97.80% test accuracy.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-900 block">Linear SVM</span>
            <p className="text-slate-600 mt-1">LinearSVC baseline with L2 penalty and balanced weights. Achieves 97.82% overall accuracy.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-900 block">Isolation Forest</span>
            <p className="text-slate-600 mt-1">Unsupervised anomaly detector with 0.08 contamination. Flags out-of-distribution events.</p>
          </div>
        </div>
      </div>

      {/* 5. Rule-Derived Severity Logic */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-600" />
          Rule-Derived Severity Logic
        </h2>
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
          <p className="font-semibold">
            Important Note: Severity is NOT a ground truth column in the raw dataset.
          </p>
          <p className="leading-relaxed">
            Severity is computed deterministically by our rule engine by cross-referencing the predicted or actual threat class against the perimeter action disposition:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Low:</strong> All events categorized as <code className="font-mono">benign</code>.</li>
            <li><strong>Medium:</strong> Probing or scanning events categorized as <code className="font-mono">suspicious</code>.</li>
            <li><strong>High:</strong> Confirmed malicious attacks where the firewall or IDS executed an active <code className="font-mono">blocked</code> action.</li>
            <li><strong>Critical:</strong> Confirmed malicious attacks where perimeter action remained <code className="font-mono">allowed</code>, indicating potential intrusion exploitation.</li>
          </ul>
        </div>
      </div>

      {/* 6. Limitations & Future Work */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          Project Limitations & Future Directions
        </h2>
        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            While the pipeline demonstrates high performance on the 6,000,000-record dataset, several academic limitations should be noted:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Synthetic Signature Bias:</strong> The dataset exhibits strong keyword correlations (e.g., &apos;DROP TABLE&apos; and &apos;sqlmap&apos;) which simplify pattern recognition. Real-world SOC environments face polymorphic and obfuscated payloads.
            </li>
            <li>
              <strong>Concept Drift:</strong> Threat actors adapt payload structures over time. Production deployment requires continuous re-training loops.
            </li>
            <li>
              <strong>Streaming Pipeline:</strong> Future work includes streaming log ingestion via Apache Kafka and real-time inference using lightweight ONNX runtimes.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
