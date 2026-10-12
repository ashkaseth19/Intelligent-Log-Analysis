# Intelligent Log Analysis and Threat Detection

> **Academic Final Year Capstone Project**  
> Department of Computer Science & Engineering  
> B.Tech / B.E. Degree Program (Academic Session: 2024–2025)

An end-to-end security log analysis and machine learning classification pipeline designed to ingest, normalize, and detect cyber threats across enterprise server and perimeter network telemetry. Built upon a 6,000,000-record dataset, this application benchmarks **Random Forest**, **Linear Support Vector Machines (LinearSVC)**, and **Isolation Forest** algorithms with deterministic rule-derived threat severity scoring and an interactive audit interface.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Dataset Description](#dataset-description)
5. [System Architecture & Folder Structure](#system-architecture--folder-structure)
6. [Machine Learning Evaluation Results](#machine-learning-evaluation-results)
7. [Rule-Derived Severity Engine](#rule-derived-severity-engine)
8. [Installation & Setup](#installation--setup)
   - [Backend Setup (Flask)](#1-backend-setup-flask)
   - [Frontend Setup (React + Vite)](#2-frontend-setup-react--vite)
9. [API Endpoint Reference](#api-endpoint-reference)
10. [Screenshots](#screenshots)
11. [Academic Limitations & Future Scope](#academic-limitations--future-scope)

---

## Project Overview

Modern Security Operations Centers (SOCs) are overwhelmed by millions of raw log entries originating from distributed firewalls, web applications, and intrusion detection systems. Traditional signature-only detection often fails against subtle multi-vector probes and novel volumetric anomalies.

This project delivers:
- **Scalable Batch Processing**: Pre-aggregation and streaming analysis capable of handling 6,000,000 records (~874 MB) without memory overflow.
- **Supervised & Unsupervised Machine Learning**: Dual-engine threat detection combining supervised multi-class classification (`benign`, `suspicious`, `malicious`) with unsupervised anomaly discovery.
- **Deterministic Severity Triaging**: Rule-based operational severity calculation (`Low`, `Medium`, `High`, `Critical`) determined by combining threat classification with perimeter firewall action dispositions.
- **Academic Research Interface**: Clean, accessible white-theme interface providing complete visibility into model metrics, feature importances, confusion matrices, and log investigation trails.

---

## Key Features

- **Telemetry Dashboard**:
  - Exact 6M-record dataset metric summaries (Total Logs, Benign, Suspicious, Malicious).
  - Threat distribution donut chart with slice separation.
  - Monthly time-series ingestion area chart tracking seasonal volume and threat emergence.
  - Single-accent Network protocol volume chart (`TCP`, `HTTP`, `HTTPS`, `UDP`, `ICMP`, `SSH`, `FTP`).
- **Upload & Analyze Logs**:
  - Drag-and-drop log ingestion supporting CSV and JSON up to 20 MB.
  - 9-column schema validation with helpful HTTP 400 rejection for missing fields.
  - Simultaneous prediction using Random Forest, Linear SVM, and Isolation Forest.
  - Client-side export of parsed results directly to CSV.
- **Threat Alerts Feed**:
  - Filtered real-time stream of suspicious and malicious security events.
  - Interactive triage buttons for filtering by operational severity (`Medium`, `High`, `Critical`).
- **Log Browser**:
  - High-performance query explorer filtering across protocol, action, sensor type, and threat class.
  - Substring search matching IP addresses, URI request paths, and user-agent strings.
  - Event detail modal showing raw fields, extracted features, and contextual explanation.
- **Model Performance & Reporting**:
  - Side-by-side comparison table of Random Forest vs. Linear SVM.
  - 3x3 Confusion matrices with color-intensity shading evaluated on 20,000 test logs.
  - Horizontal feature importance bar chart highlighting predictive URI keywords.
  - Unsupervised anomaly detection metrics from Isolation Forest.
  - Automated PDF summary and CSV metrics report generation via ReportLab.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, Vite 8, React Router v7 |
| **Styling & Design System** | Tailwind CSS v4, Lucide Icons |
| **Data Visualization** | Recharts (ResponsiveContainer, AreaChart, BarChart, PieChart) |
| **HTTP Client** | Axios (configured with Vite reverse proxy `/api` -> `http://localhost:5000`) |
| **Backend Framework** | Python 3.11, Flask 3.0, Flask-CORS |
| **Data Processing & ML** | Scikit-Learn 1.9, Pandas 3.0, NumPy, Joblib, PyArrow |
| **Report Generation** | ReportLab 5.0 (PDF document generation) |
| **Testing** | Pytest (Unit and API integration testing) |

---

## Dataset Description

The system evaluates telemetry records from `cybersecurity_threat_detection_logs.csv`:
- **Total Volume**: 6,000,000 rows (~874 MB raw CSV)
- **Time Horizon**: January 1, 2024 to December 31, 2024 (~500,000 logs/month)
- **Class Proportions**:
  - **Benign**: 5,517,611 records (91.96%)
  - **Suspicious**: 360,883 records (6.01%)
  - **Malicious**: 121,506 records (2.03%)

### Schema Definitions (10 Columns)

| Field Name | Data Type | Description | Sample Value |
|---|---|---|---|
| `timestamp` | DateTime | Timestamp of logged network or application event | `2024-11-21 00:00:00` |
| `source_ip` | String | Source IPv4 address initiating traffic | `187.14.173.168` |
| `dest_ip` | String | Internal network destination IPv4 address | `192.168.1.78` |
| `protocol` | Categorical | Network protocol used (TCP, HTTP, HTTPS, UDP, etc.) | `HTTP` |
| `action` | Categorical | Perimeter policy enforcement (`allowed` vs `blocked`) | `allowed` |
| `log_type` | Categorical | Ingestion sensor (`application`, `ids`, `firewall`) | `firewall` |
| `bytes_transferred` | Integer | Payload size transferred in bytes | `2538` |
| `user_agent` | String | HTTP client user-agent header | `curl/7.64.1` |
| `request_path` | String | Target URI path including parameters and query strings | `/api/login?DROP TABLE` |
| `threat_label` | Target Class | Ground truth classification (`benign`, `suspicious`, `malicious`) | `malicious` |

---

## System Architecture & Folder Structure

```
Log_Analysis/
├── backend/
│   ├── app.py                      # Flask REST API endpoints and error handlers
│   ├── model.py                    # ML model training, serialization, and inference engine
│   ├── preprocessing.py            # Data cleaning, feature extraction, and severity rules
│   ├── compute_stats.py            # 6M-record chunked aggregator and sample generator
│   ├── report_generator.py         # ReportLab PDF & CSV metric export generator
│   ├── requirements.txt            # Python dependencies
│   ├── cache/
│   │   ├── stats.json              # Pre-computed 6M-record telemetry statistics
│   │   └── sample_records.csv      # 100k uniform random stratified evaluation sample
│   ├── models/
│   │   ├── random_forest.joblib    # Serialized Random Forest classifier
│   │   ├── svm.joblib              # Serialized LinearSVC classifier
│   │   ├── isolation_forest.joblib # Serialized Isolation Forest model
│   │   ├── preprocessor.joblib     # Fitted Scikit-Learn transformer pipeline
│   │   └── metrics.json            # Evaluated test metrics, confusion matrices, importances
│   └── tests/
│       └── test_preprocessing_and_api.py # Pytest test suite (13 passing tests)
├── data/
│   └── cybersecurity_threat_detection_logs.csv  # 6,000,000 raw dataset records
├── src/
│   ├── components/
│   │   ├── common/                 # StatCard, Badges, Skeletons, Error & Empty states
│   │   ├── layout/                 # Header, Sidebar, MainLayout
│   │   └── modals/                 # EventDetailModal (inspection view)
│   ├── pages/
│   │   ├── Dashboard.jsx           # Main overview with 4 stat cards & 3 charts
│   │   ├── LogAnalysis.jsx         # Upload & Analyze Logs drag-and-drop inference
│   │   ├── ThreatAlerts.jsx        # Suspicious & Malicious prioritized alert feed
│   │   ├── Logs.jsx                # Log Browser query explorer with filters
│   │   ├── ModelPerformance.jsx    # Model comparison, confusion matrices, feature charts
│   │   ├── About.jsx               # Academic project documentation & team details
│   │   ├── Login.jsx               # Demo access page
│   │   └── NotFound.jsx            # 404 handler
│   ├── services/
│   │   └── api.js                  # Axios centralized client with proxy routing
│   ├── utils/
│   │   ├── colors.js               # Clean white theme tokens & threat color palette
│   │   └── formatters.js           # Number, compact, and percent formatters
│   ├── App.jsx                     # Route declarations
│   └── main.jsx                    # Application root entry
├── .env.example                    # Environment variable template
├── .gitignore                      # Git exclusion rules
├── package.json                    # Node dependencies and build scripts
├── vite.config.js                  # Vite configuration and /api proxy
└── README.md                       # Project documentation
```

---

## Machine Learning Evaluation Results

Models were evaluated on a held-out test split of **20,000 records** drawn via stratified sampling from a 100,000-record sample of the 6M dataset (`random_state=42`):

### 1. Supervised Model Comparison (3-Class)

| Metric | Random Forest (Primary) | Linear SVM (Baseline) | Operational Observation |
|---|---|---|---|
| **Overall Accuracy** | **97.80%** | 97.82% | Dominated by the 91.9% benign class baseline. |
| **Weighted Precision** | **96.66%** | 95.83% | Random Forest produces substantially fewer false positives on malicious attack tokens. |
| **Weighted Recall** | **97.80%** | 97.82% | Both models reliably flag benign baseline traffic. |
| **Weighted F1 Score** | **96.95%** | 96.82% | Random Forest demonstrates higher balanced performance. |

### 2. Confusion Matrix Comparison (20,000 Test Records)

**Random Forest Classifier**:
```
Actual \ Predicted |  Benign  | Suspicious | Malicious
-------------------|----------|------------|----------
Benign (18,387)    |  18,377  |      0     |    10
Suspicious (1,205) |      20  |  1,170     |    15
Malicious (408)    |     337  |     57     |    14
```

**Linear SVM Classifier**:
```
Actual \ Predicted |  Benign  | Suspicious | Malicious
-------------------|----------|------------|----------
Benign (18,387)    |  18,387  |      0     |     0
Suspicious (1,205) |      27  |  1,178     |     0
Malicious (408)    |     338  |     70     |     0
```

> **Class Imbalance Note**: Because malicious events comprise only ~2.04% of the dataset, linear hyperplane separation in LinearSVC collapses to zero detections for the minority malicious class without non-linear tree partitions and balanced sample weights.

### 3. Top Random Forest Feature Importances
1. `path:phpmyadmin` (15.12%)
2. `path:sql` (9.18%)
3. `bytes_transferred_log` (9.12%)
4. `path:admin` (7.98%)
5. `path:etc` (7.56%)
6. `path:passwd` (7.23%)
7. `path:login` (6.43%)
8. `path:backup` (6.12%)
9. `protocol_ICMP` (4.31%)
10. `protocol_HTTP` (3.74%)

### 4. Unsupervised Anomaly Detection (Isolation Forest)
- **Model Type**: Isolation Forest (`contamination=0.08`, `n_estimators=100`)
- **Evaluated Test Samples**: 20,000
- **Anomalies Flagged**: 1,621 (8.11%)
- **Normal Baseline**: 18,379 (91.89%)
- **Mean Anomaly Score**: 0.0453

---

## Rule-Derived Severity Engine

> **Important Methodology Note**: Severity is **NOT** a ground-truth column in the original dataset CSV. It is computed deterministically by the rule engine to assist SOC triage:

| Derived Severity | Threat Label | Action Policy | Rationale |
|---|---|---|---|
| **Low** | `benign` | `allowed` or `blocked` | Standard operational traffic exhibiting no indicators of compromise. |
| **Medium** | `suspicious` | `blocked` | Perimeter reconnaissance or scanner activity stopped by defensive controls. |
| **High** | `suspicious` | `allowed` | Reconnaissance probe permitted past perimeter; requires manual review. |
| **High** | `malicious` | `blocked` | Confirmed attack payload successfully neutralized by firewall or IDS. |
| **Critical** | `malicious` | `allowed` | Confirmed destructive exploit or SQL injection permitted; potential active breach. |

---

## Installation & Setup

### Prerequisites
- **Python**: Version 3.10 or 3.11
- **Node.js**: Version 18.x or 20.x (with `npm`)

---

### 1. Backend Setup (Flask)

1. **Navigate to project root and create virtual environment**:
   ```bash
   # On Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **(Optional) Recompute dataset statistics or retrain models**:
   ```bash
   # Aggregate 6M dataset records to backend/cache/stats.json
   python backend/compute_stats.py

   # Retrain Random Forest, SVM, and Isolation Forest
   python backend/model.py
   ```

4. **Run the Backend API Server**:
   ```bash
   python backend/app.py
   # Starts Flask on http://localhost:5000
   ```

5. **Run backend unit and integration tests**:
   ```bash
   python -m pytest backend/tests/test_preprocessing_and_api.py -v
   # Runs 13 tests verifying data cleaning, severity rules, and all API endpoints
   ```

---

### 2. Frontend Setup (React + Vite)

1. **Install Node packages**:
   ```bash
   npm install
   ```

2. **Start the Vite development server**:
   ```bash
   npm run dev
   # Vite development server starts on http://localhost:3000
   ```

3. **Build production bundle**:
   ```bash
   npm run build
   # Outputs optimized static bundle to dist/
   ```

---

## API Endpoint Reference

| Method | Endpoint | Description | Query / Body Parameters |
|---|---|---|---|
| `GET` | `/api/health` | Health check & model status | None |
| `GET` | `/api/stats` | Pre-computed 6M-record statistics | None |
| `GET` | `/api/logs` | Query logs with pagination & filtering | `search`, `protocol`, `action`, `log_type`, `threat_label`, `page`, `pageSize` |
| `GET` | `/api/alerts` | Filtered stream of suspicious/malicious alerts | `severity` (`ALL`, `Medium`, `High`, `Critical`) |
| `POST` | `/api/analyze` | Ingest and profile uploaded log file | `multipart/form-data` with `file` (CSV / JSON up to 20 MB) |
| `GET` | `/api/reports` | Evaluated ML model metrics & confusion matrices | None |
| `GET` | `/api/reports/export` | Download real evaluation report | `format` (`pdf` or `csv`) |

---

## Screenshots

*(Placeholder for academic project report and presentation slides)*

| Dashboard Overview | Model Performance & Evaluation |
|:---:|:---:|
| `[ Insert Dashboard Screenshot ]` | `[ Insert Model Performance Screenshot ]` |

| Upload & Analyze Logs | Log Browser & Audit Explorer |
|:---:|:---:|
| `[ Insert Log Analysis Screenshot ]` | `[ Insert Log Browser Screenshot ]` |

---

## Academic Limitations & Future Scope

1. **Synthetic Signature Heuristics**:  
   The underlying dataset has strong keyword correlations (e.g. `DROP TABLE`, `sqlmap`, `/etc/passwd`). In live corporate infrastructure, modern attacks use polymorphic and base64-encoded evasion techniques.
2. **Concept Drift**:  
   Adversarial methods evolve rapidly. Static model weights require continuous online retraining pipelines to maintain predictive precision.
3. **Streaming Ingestion**:  
   Future extensions could integrate Apache Kafka or RabbitMQ event streaming with lightweight ONNX runtime microservices for sub-millisecond inference per packet.
