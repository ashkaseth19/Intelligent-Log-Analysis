import os
import io
import sys
import json
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from sklearn.metrics import accuracy_score

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from preprocessing import (
    get_dataset_path, clean_dataframe,
    compute_derived_severity, compute_derived_severity_vectorized,
    generate_log_explanation
)
from model import ThreatInferenceEngine
from report_generator import generate_csv_report, generate_pdf_report

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Limit upload file size to 20 MB
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024

REQUIRED_COLUMNS = [
    'timestamp', 'source_ip', 'dest_ip', 'protocol', 'action',
    'log_type', 'bytes_transferred', 'user_agent', 'request_path'
]

CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)
STATS_CACHE_FILE = os.path.join(CACHE_DIR, 'stats.json')
SAMPLE_CACHE_FILE = os.path.join(CACHE_DIR, 'sample_records.csv')

# Global Inference Engine initialization
inference_engine = ThreatInferenceEngine()

# Cache indexed dataset sample (sampled uniformly across entire 6M rows)
print("Initializing API dataset cache...")
try:
    if os.path.exists(SAMPLE_CACHE_FILE):
        print(f"Loading cached full-dataset uniform sample: {SAMPLE_CACHE_FILE}")
        CACHE_DF = clean_dataframe(pd.read_csv(SAMPLE_CACHE_FILE))
    else:
        print("Sampling dataset for API cache...")
        from compute_stats import compute_and_cache_dataset_stats
        compute_and_cache_dataset_stats()
        CACHE_DF = clean_dataframe(pd.read_csv(SAMPLE_CACHE_FILE))
    print(f"API dataset index cached ({len(CACHE_DF):,} records).")
except Exception as e:
    print(f"Warning: Could not pre-index dataset: {e}")
    CACHE_DF = pd.DataFrame()

if not inference_engine.loaded:
    print("[Flask Startup] Notice: ML models not found. Run 'python model.py' to train models.")
else:
    print("[Flask Startup] ML inference models are loaded and ready.")

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({"error": "Uploaded file exceeds the maximum allowed size of 20 MB."}), 413

@app.route('/api/health', methods=['GET'])
def health_check():
    """GET /api/health - Backend status check"""
    models_ready = (
        inference_engine.loaded and
        inference_engine.rf_model is not None and
        inference_engine.svm_model is not None and
        inference_engine.iso_model is not None and
        inference_engine.preprocessor is not None
    )
    return jsonify({
        "status": "healthy" if models_ready else "degraded",
        "service": "ThreatDetect AI Flask Backend",
        "models_status": "ready" if models_ready else "missing_models - run 'python model.py' to train",
        "dataset_loaded": len(CACHE_DF) > 0,
        "total_dataset_records": 6000000,
        "models_loaded": {
            "random_forest": inference_engine.rf_model is not None,
            "svm": inference_engine.svm_model is not None,
            "isolation_forest": inference_engine.iso_model is not None,
            "preprocessor": inference_engine.preprocessor is not None
        }
    })

@app.route('/api/stats', methods=['GET'])
def get_dashboard_stats():
    """GET /api/stats - Dashboard summary metrics calculated from 6M dataset in chunks and cached"""
    if os.path.exists(STATS_CACHE_FILE):
        with open(STATS_CACHE_FILE, 'r') as f:
            stats = json.load(f)
            return jsonify(stats)

    from compute_stats import compute_and_cache_dataset_stats
    stats = compute_and_cache_dataset_stats()
    return jsonify(stats)

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """GET /api/logs - Paginated, filterable & searchable log records"""
    if CACHE_DF.empty:
        return jsonify({"data": [], "total": 0, "page": 1, "pageSize": 10})

    search = request.args.get('search', '').strip().lower()
    protocol = request.args.get('protocol', 'ALL').strip().upper()
    action = request.args.get('action', 'ALL').strip().lower()
    log_type = request.args.get('log_type', 'ALL').strip().lower()
    threat_label = request.args.get('threat_label', 'ALL').strip().lower()
    severity = request.args.get('severity', 'ALL').strip().lower()

    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('pageSize', 10))

    df = CACHE_DF.copy()

    if search:
        mask = (
            df['source_ip'].str.lower().str.contains(search, na=False) |
            df['dest_ip'].str.lower().str.contains(search, na=False) |
            df['request_path'].str.lower().str.contains(search, na=False) |
            df['user_agent'].str.lower().str.contains(search, na=False)
        )
        df = df[mask]

    if protocol != 'ALL':
        df = df[df['protocol'].str.upper() == protocol]

    if action != 'all':
        df = df[df['action'].str.lower() == action]

    if log_type != 'all':
        df = df[df['log_type'].str.lower() == log_type]

    if threat_label != 'all':
        df = df[df['threat_label'].str.lower() == threat_label]

    # Calculate vectorized severity
    sevs = compute_derived_severity_vectorized(df)
    df['derived_severity'] = sevs

    if severity != 'all':
        df = df[df['derived_severity'].str.lower() == severity]

    total = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    sliced = df.iloc[start:end]

    formatted_records = []
    for idx, row in sliced.iterrows():
        row_dict = row.to_dict()
        threat = str(row_dict.get('threat_label', 'benign')).lower()
        derived_sev = str(row_dict.get('derived_severity', 'Low'))
        exp = generate_log_explanation(row_dict)

        record = {
            "id": f"LOG-REF-{idx+1:06d}",
            "timestamp": str(row_dict.get('timestamp', '')),
            "source_ip": str(row_dict.get('source_ip', '')),
            "dest_ip": str(row_dict.get('dest_ip', '')),
            "protocol": str(row_dict.get('protocol', '')),
            "action": str(row_dict.get('action', '')),
            "log_type": str(row_dict.get('log_type', '')),
            "bytes_transferred": int(row_dict.get('bytes_transferred', 0)),
            "user_agent": str(row_dict.get('user_agent', '')),
            "request_path": str(row_dict.get('request_path', '')),
            "threat_label": threat,
            "severity": derived_sev,
            "explanation": exp
        }
        formatted_records.append(record)

    return jsonify({
        "data": formatted_records,
        "total": total,
        "page": page,
        "pageSize": page_size
    })

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """GET /api/alerts - Active suspicious and malicious threat alerts"""
    severity_filter = request.args.get('severity', 'ALL').strip().lower()

    if CACHE_DF.empty:
        return jsonify([])

    # Filter for suspicious & malicious logs
    threat_df = CACHE_DF[CACHE_DF['threat_label'].isin(['suspicious', 'malicious'])].copy()
    threat_df['derived_severity'] = compute_derived_severity_vectorized(threat_df)

    if severity_filter != 'all':
        threat_df = threat_df[threat_df['derived_severity'].str.lower() == severity_filter]

    threat_df = threat_df.head(200)

    alerts = []
    for idx, row in threat_df.iterrows():
        row_dict = row.to_dict()
        threat = str(row_dict.get('threat_label', 'suspicious')).lower()
        act = str(row_dict.get('action', 'allowed')).lower()
        derived_sev = str(row_dict.get('derived_severity', 'High'))
        exp = generate_log_explanation(row_dict)

        alerts.append({
            "id": f"ALERT-{idx+1:06d}",
            "timestamp": str(row_dict.get('timestamp', '')),
            "source_ip": str(row_dict.get('source_ip', '')),
            "dest_ip": str(row_dict.get('dest_ip', '')),
            "protocol": str(row_dict.get('protocol', '')),
            "action": act,
            "log_type": str(row_dict.get('log_type', '')),
            "bytes_transferred": int(row_dict.get('bytes_transferred', 0)),
            "user_agent": str(row_dict.get('user_agent', '')),
            "request_path": str(row_dict.get('request_path', '')),
            "threat_label": threat,
            "severity": derived_sev,
            "explanation": exp
        })

    return jsonify(alerts)

@app.route('/api/analyze', methods=['POST'])
def analyze_logs():
    """POST /api/analyze - Process uploaded log file through ML pipeline with schema validation"""
    if not inference_engine.loaded:
        return jsonify({
            "error": "ML models are missing or not trained yet. Run 'python model.py' in the backend terminal to train models before analyzing logs."
        }), 503

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded. Please attach a CSV or JSON file."}), 400

    file = request.files['file']
    filename = file.filename or 'upload.csv'
    content = file.read()
    file_size_kb = f"{len(content) / 1024:.2f} KB"

    if len(content) == 0:
        return jsonify({"error": "Uploaded file is empty."}), 400

    try:
        if filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))

        df = df.reset_index(drop=True)

        # Validate required columns
        missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_columns:
            return jsonify({
                "error": f"Uploaded file is missing required columns: {', '.join(missing_columns)}",
                "missing_columns": missing_columns,
                "required_columns": REQUIRED_COLUMNS
            }), 400

        df_clean = clean_dataframe(df)
        preds = inference_engine.predict_logs(df_clean)

        has_actual = 'threat_label' in df.columns
        actual_labels = [str(x).lower() for x in df['threat_label']] if has_actual else None
        overall_accuracy = None
        if has_actual:
            pred_final_labels = [p['final_threat_label'] for p in preds]
            overall_accuracy = float(accuracy_score(actual_labels, pred_final_labels))

        # Vectorized severity computation
        derived_sevs = compute_derived_severity_vectorized(
            df_clean,
            threat_series=[p['final_threat_label'] for p in preds]
        )

        summary_counts = {"benign": 0, "suspicious": 0, "malicious": 0}
        formatted_results = []

        for idx in range(len(df_clean)):
            pred_meta = preds[idx]
            threat = pred_meta['final_threat_label']
            summary_counts[threat] = summary_counts.get(threat, 0) + 1
            row_dict = df_clean.iloc[idx].to_dict()
            exp = generate_log_explanation({**row_dict, 'threat_label': threat})

            record = {
                "id": f"ANALYSIS-{idx+1:04d}",
                "timestamp": str(row_dict.get('timestamp', '')),
                "source_ip": str(row_dict.get('source_ip', '')),
                "dest_ip": str(row_dict.get('dest_ip', '')),
                "protocol": str(row_dict.get('protocol', '')),
                "action": str(row_dict.get('action', '')),
                "log_type": str(row_dict.get('log_type', '')),
                "bytes_transferred": int(row_dict.get('bytes_transferred', 0)),
                "user_agent": str(row_dict.get('user_agent', '')),
                "request_path": str(row_dict.get('request_path', '')),
                "threat_label": threat,
                "severity": str(derived_sevs[idx]),
                "rf_threat_label": pred_meta['rf_threat_label'],
                "rf_confidence": pred_meta['rf_confidence'],
                "svm_threat_label": pred_meta['svm_threat_label'],
                "is_anomaly": pred_meta['is_anomaly'],
                "anomaly_score": pred_meta['anomaly_score'],
                "explanation": exp
            }
            if has_actual:
                record["actual_label"] = actual_labels[idx]

            formatted_results.append(record)

        response_payload = {
            "filename": filename,
            "fileSize": file_size_kb,
            "processedLogsCount": len(df_clean),
            "analysisSummary": summary_counts,
            "hasActualLabels": has_actual,
            "results": formatted_results
        }
        if has_actual and overall_accuracy is not None:
            response_payload["accuracy"] = round(overall_accuracy * 100, 2)

        return jsonify(response_payload)

    except Exception as e:
        print(f"Error during log analysis: {e}")
        return jsonify({"error": f"Failed to parse and profile log file: {str(e)}"}), 500

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """GET /api/reports - Calculated ML model evaluation metrics & dataset report"""
    metrics = inference_engine.metrics or {}
    return jsonify(metrics)

@app.route('/api/reports/export', methods=['POST', 'GET'])
def export_report():
    """POST /api/reports/export - Generates and returns real CSV or PDF report as file download"""
    # Accept format from either JSON body or query param
    req_data = request.get_json(silent=True) or {}
    fmt = request.args.get('format', req_data.get('format', 'pdf')).strip().lower()

    # Load current stats and metrics
    stats = {}
    if os.path.exists(STATS_CACHE_FILE):
        with open(STATS_CACHE_FILE, 'r') as f:
            stats = json.load(f)

    metrics = inference_engine.metrics or {}

    if fmt == 'csv':
        csv_bytes = generate_csv_report(stats=stats, metrics=metrics)
        return send_file(
            io.BytesIO(csv_bytes),
            mimetype='text/csv',
            as_attachment=True,
            download_name='threat_detection_model_report.csv'
        )
    else:
        # Default to PDF
        pdf_bytes = generate_pdf_report(stats=stats, metrics=metrics)
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name='threat_detection_model_report.pdf'
        )

if __name__ == '__main__':
    print("Starting Flask Backend on http://localhost:5000...")
    app.run(host='0.0.0.0', port=5000, debug=False)
