import React, { useState } from 'react';
import { apiService } from '../services/api';
import { ThreatBadge } from '../components/common/ThreatBadge';
import { ActionBadge } from '../components/common/ActionBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { EventDetailModal } from '../components/modals/EventDetailModal';
import { ErrorMessage } from '../components/common/ErrorMessage';
import {
  Upload,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  FileText,
  RotateCw,
  Info,
  Download,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export const LogAnalysis = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setAnalysisProgress(15);

    const timer1 = setTimeout(() => setAnalysisProgress(45), 250);
    const timer2 = setTimeout(() => setAnalysisProgress(75), 500);

    try {
      const data = await apiService.analyzeLogs(file);
      setAnalysisProgress(100);
      setResults(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(
        err?.response?.data?.error ||
        (err?.response?.data?.missing_columns
          ? `Missing required columns: ${err.response.data.missing_columns.join(', ')}`
          : err.message || 'Log analysis and profiling failed.')
      );
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setAnalyzing(false);
    }
  };

  // Sample CSV loader based on actual dataset schema
  const loadSampleFile = () => {
    const sampleCsvContent =
      'timestamp,source_ip,dest_ip,protocol,action,log_type,bytes_transferred,user_agent,request_path,threat_label\n' +
      '2024-11-21T00:00:00,187.14.173.168,192.168.1.78,HTTP,allowed,firewall,2538,curl/7.64.1,/api/login?DROP TABLE,malicious\n' +
      '2024-12-05T00:00:00,141.26.13.167,192.168.1.141,TCP,allowed,ids,26588,SQLMap/1.6-dev,/?..\\..\\etc\\passwd,suspicious\n' +
      '2024-04-07T00:00:00,192.168.1.248,192.168.1.15,HTTP,allowed,application,20652,"Mozilla/5.0 (Windows NT 10.0; Win64; x64)",/login,benign\n' +
      '2024-10-14T00:00:00,192.168.1.20,192.168.1.242,HTTPS,allowed,application,2461,curl/7.64.1,/admin/config,benign\n' +
      '2024-08-19T00:00:00,172.16.0.45,192.168.1.100,TCP,blocked,firewall,18200,Hydra/9.1,/ssh/auth,suspicious\n' +
      '2024-03-12T00:00:00,10.0.0.12,192.168.1.5,HTTP,blocked,ids,1200,sqlmap/1.4.7,/phpmyadmin/setup.php,malicious';

    const sampleBlob = new Blob([sampleCsvContent], { type: 'text/csv' });
    const mockFile = new File([sampleBlob], 'sample_cybersecurity_logs.csv', {
      type: 'text/csv'
    });
    setFile(mockFile);
  };

  // Download results as client-side CSV
  const downloadResultsCsv = () => {
    if (!results || !results.results || results.results.length === 0) return;

    const headers = [
      'timestamp',
      'source_ip',
      'dest_ip',
      'protocol',
      'action',
      'log_type',
      'bytes_transferred',
      'user_agent',
      'request_path',
      'rf_threat_label',
      'rf_confidence',
      'svm_threat_label',
      'is_anomaly',
      'anomaly_score',
      'derived_severity',
      ...(results.hasActualLabels ? ['actual_label'] : []),
      'explanation'
    ];

    const escapeCsv = (str) => {
      const val = str === null || str === undefined ? '' : String(str);
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = results.results.map((row) => [
      row.timestamp,
      row.source_ip,
      row.dest_ip,
      row.protocol,
      row.action,
      row.log_type,
      row.bytes_transferred,
      escapeCsv(row.user_agent),
      escapeCsv(row.request_path),
      row.rf_threat_label,
      `${(row.rf_confidence * 100).toFixed(1)}%`,
      row.svm_threat_label,
      row.is_anomaly ? 'yes' : 'no',
      row.anomaly_score,
      row.severity,
      ...(results.hasActualLabels ? [row.actual_label || ''] : []),
      escapeCsv(row.explanation)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_results_${results.filename || 'export'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Upload & Analyze Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload log files to run inference through trained Random Forest, SVM, and Isolation Forest models
        </p>
      </div>

      {/* Required Schema Note */}
      <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Required CSV Schema (9 required columns):</strong>{' '}
          <code className="text-blue-800 font-mono text-[11px]">
            timestamp, source_ip, dest_ip, protocol, action, log_type, bytes_transferred, user_agent, request_path
          </code>{' '}
          (optional 10th column: <code className="text-blue-800 font-mono text-[11px]">threat_label</code> for validation).
          Maximum upload size: 20 MB.
        </span>
      </div>

      {/* Upload UI & File Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drag and drop card */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" />
            Select Log File
          </h2>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-400'
            }`}
          >
            <input
              type="file"
              id="log-file-input"
              className="hidden"
              onChange={handleFileChange}
              accept=".csv,.log,.txt,.json"
            />
            <label htmlFor="log-file-input" className="cursor-pointer flex flex-col items-center">
              <div className="p-3.5 rounded-full bg-white border border-slate-200 text-blue-600 mb-3 shadow-sm">
                <FileCode className="w-8 h-8" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Click to browse or drop CSV/log file here
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports CSV (10 standard columns) or JSON format (up to 20 MB)
              </p>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
            <button
              onClick={loadSampleFile}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Load Sample CSV Snippet (6 records)</span>
            </button>

            {file && (
              <button
                onClick={() => {
                  setFile(null);
                  setResults(null);
                  setError(null);
                }}
                className="text-xs text-slate-500 hover:text-red-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1"
              >
                Clear File
              </button>
            )}
          </div>
        </div>

        {/* Selected File Details & Trigger */}
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              File Information
            </h2>

            {file ? (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Filename:</span>
                  <span className="font-mono text-slate-900 truncate max-w-[150px] font-medium">{file.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File Size:</span>
                  <span className="font-mono text-slate-900">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pipeline Models:</span>
                  <span className="text-blue-700 font-medium">RF + SVM + IsoForest</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Label Target:</span>
                  <span className="text-emerald-700 font-medium">Benign, Sus, Mal</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs border border-slate-200 rounded-lg bg-slate-50">
                No file selected. Drop a log file or click &quot;Load Sample CSV Snippet&quot;.
              </div>
            )}
          </div>

          <button
            onClick={startAnalysis}
            disabled={!file || analyzing}
            className="w-full mt-4 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {analyzing ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Running Inference...</span>
              </>
            ) : (
              <>
                <span>Run Model Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {analyzing && (
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Executing ML inference pipeline (Random Forest, SVM, Isolation Forest)...</span>
            <span className="font-mono font-semibold">{analysisProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <ErrorMessage
          title="Analysis Error"
          message={error}
          onRetry={file ? startAnalysis : undefined}
          retryLabel="Retry Analysis"
        />
      )}

      {/* Analysis Results View */}
      {results && !analyzing && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm border-l-4 border-l-blue-600">
              <span className="text-xs text-slate-500 font-medium">Processed Records</span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                {results.processedLogsCount}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{results.filename}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Benign Predicted</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-bold font-mono text-emerald-600 mt-1">
                {results.analysisSummary?.benign || 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {results.processedLogsCount > 0
                  ? `${(((results.analysisSummary?.benign || 0) / results.processedLogsCount) * 100).toFixed(1)}% of upload`
                  : ''}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Suspicious Predicted</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-xl font-bold font-mono text-amber-600 mt-1">
                {results.analysisSummary?.suspicious || 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {results.processedLogsCount > 0
                  ? `${(((results.analysisSummary?.suspicious || 0) / results.processedLogsCount) * 100).toFixed(1)}% of upload`
                  : ''}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm border-l-4 border-l-red-600">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Malicious Predicted</span>
                <ShieldAlert className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-xl font-bold font-mono text-red-600 mt-1">
                {results.analysisSummary?.malicious || 0}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {results.hasActualLabels && results.accuracy !== undefined ? (
                  <span className="text-blue-700 font-medium">
                    Accuracy: {results.accuracy}% vs Ground Truth
                  </span>
                ) : (
                  `${results.processedLogsCount > 0 ? (((results.analysisSummary?.malicious || 0) / results.processedLogsCount) * 100).toFixed(1) : 0}% of upload`
                )}
              </p>
            </div>
          </div>

          {/* Results Table Card */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Model Inference Predictions & Anomaly Scores
                </h3>
                <p className="text-xs text-slate-500">
                  Primary prediction from Random Forest, baseline comparison from LinearSVM, out-of-distribution flag from Isolation Forest
                </p>
              </div>

              {/* Download CSV button */}
              <button
                onClick={downloadResultsCsv}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Results (CSV)</span>
              </button>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                    <th className="p-3 whitespace-nowrap">Timestamp</th>
                    <th className="p-3 whitespace-nowrap">Source IP</th>
                    <th className="p-3 whitespace-nowrap">Request Path</th>
                    <th className="p-3 whitespace-nowrap">Protocol / Action</th>
                    <th className="p-3 whitespace-nowrap">Random Forest (Confidence)</th>
                    <th className="p-3 whitespace-nowrap">SVM Baseline</th>
                    <th className="p-3 whitespace-nowrap">Anomaly Flag</th>
                    {results.hasActualLabels && <th className="p-3 whitespace-nowrap">Actual Label</th>}
                    <th className="p-3 whitespace-nowrap">Derived Severity</th>
                    <th className="p-3 text-right whitespace-nowrap">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.results.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedEvent(log)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
                    >
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-3 font-mono text-blue-700 font-medium whitespace-nowrap">{log.source_ip}</td>
                      <td className="p-3 font-mono text-slate-700 max-w-[200px] truncate" title={log.request_path}>
                        {log.request_path || '/'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-mono text-slate-800">{log.protocol}</span>{' '}
                        <span className="text-slate-400">/</span> <ActionBadge action={log.action} />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ThreatBadge label={log.rf_threat_label || log.threat_label} />
                          <span className="font-mono text-[11px] text-slate-500">
                            {log.rf_confidence !== undefined ? `${(log.rf_confidence * 100).toFixed(0)}%` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <ThreatBadge label={log.svm_threat_label} />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {log.is_anomaly ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Anomaly ({log.anomaly_score})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Normal
                          </span>
                        )}
                      </td>
                      {results.hasActualLabels && (
                        <td className="p-3 whitespace-nowrap">
                          <ThreatBadge label={log.actual_label} />
                        </td>
                      )}
                      <td className="p-3 whitespace-nowrap">
                        <SeverityBadge severity={log.severity} />
                      </td>
                      <td className="p-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedEvent(log)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors inline-flex items-center gap-1 text-xs font-medium cursor-pointer"
                          title="Inspect Event"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};
