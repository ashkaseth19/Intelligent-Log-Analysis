import os
import io
import sys
import json
import pytest
import pandas as pd

# Add backend directory to sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from preprocessing import (
    clean_dataframe,
    compute_derived_severity,
    compute_derived_severity_vectorized,
    generate_log_explanation
)
from app import app


# -------------------------------------------------------------
# 1. Preprocessing Unit Tests
# -------------------------------------------------------------
def test_compute_derived_severity_rules():
    """Verify deterministic rule mapping for derived severity"""
    # 1. Benign -> Low (regardless of allowed/blocked)
    assert compute_derived_severity('benign', 'allowed') == 'Low'
    assert compute_derived_severity('benign', 'blocked') == 'Low'

    # 2. Suspicious + blocked -> Medium, Suspicious + allowed -> High
    assert compute_derived_severity('suspicious', 'blocked') == 'Medium'
    assert compute_derived_severity('suspicious', 'allowed') == 'High'

    # 3. Malicious + blocked -> High
    assert compute_derived_severity('malicious', 'blocked') == 'High'

    # 4. Malicious + allowed -> Critical
    assert compute_derived_severity('malicious', 'allowed') == 'Critical'


def test_compute_derived_severity_vectorized():
    """Verify vectorized version matches scalar outputs across multiple rows"""
    df = pd.DataFrame([
        {'threat_label': 'benign', 'action': 'allowed'},
        {'threat_label': 'suspicious', 'action': 'blocked'},
        {'threat_label': 'suspicious', 'action': 'allowed'},
        {'threat_label': 'malicious', 'action': 'blocked'},
        {'threat_label': 'malicious', 'action': 'allowed'}
    ])
    sevs = compute_derived_severity_vectorized(df).tolist()
    assert sevs == ['Low', 'Medium', 'High', 'High', 'Critical']


def test_clean_dataframe_pipeline():
    """Verify clean_dataframe correctly handles missing values, types, and defaults"""
    raw_data = {
        'timestamp': ['2024-05-01 12:00:00', None],
        'source_ip': ['192.168.1.10', None],
        'dest_ip': ['10.0.0.1', '10.0.0.2'],
        'protocol': ['tcp', 'UDP'],
        'action': ['ALLOWED', 'blocked'],
        'log_type': ['firewall', 'IDS'],
        'bytes_transferred': ['1024', None],
        'user_agent': ['Mozilla', None],
        'request_path': ['/login', None]
    }
    df = pd.DataFrame(raw_data)
    cleaned = clean_dataframe(df)

    assert len(cleaned) == 2
    assert cleaned.loc[0, 'protocol'] == 'TCP'
    assert cleaned.loc[1, 'protocol'] == 'UDP'
    assert cleaned.loc[0, 'action'] == 'allowed'
    assert cleaned.loc[0, 'bytes_transferred'] == 1024
    assert cleaned.loc[1, 'bytes_transferred'] == 0
    assert cleaned.loc[1, 'request_path'] == '/'


def test_generate_log_explanation():
    """Verify threat explanation string generation for malicious and suspicious patterns"""
    sql_log = {
        'threat_label': 'malicious',
        'request_path': '/api/search?DROP TABLE',
        'action': 'blocked',
        'protocol': 'HTTP',
        'log_type': 'firewall'
    }
    exp = generate_log_explanation(sql_log)
    assert 'SQL injection' in exp or 'malicious' in exp.lower()

    traversal_log = {
        'threat_label': 'malicious',
        'request_path': '/../../etc/passwd',
        'action': 'allowed',
        'protocol': 'HTTP'
    }
    exp2 = generate_log_explanation(traversal_log)
    assert 'traversal' in exp2.lower()

    scanner_log = {
        'threat_label': 'suspicious',
        'request_path': '/admin',
        'user_agent': 'Nmap Scripting Engine',
        'action': 'allowed',
        'protocol': 'TCP'
    }
    exp3 = generate_log_explanation(scanner_log)
    assert 'scanner' in exp3.lower() or 'reconnaissance' in exp3.lower()


# -------------------------------------------------------------
# 2. Flask API Integration Tests
# -------------------------------------------------------------
@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_api_health(client):
    """GET /api/health returns 200 with service status and model metadata"""
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] in ['healthy', 'degraded']
    assert 'models_loaded' in data
    assert 'total_dataset_records' in data


def test_api_stats(client):
    """GET /api/stats returns 200 with total dataset summary and timelines"""
    res = client.get('/api/stats')
    assert res.status_code == 200
    data = res.get_json()
    assert 'summary' in data
    assert data['summary']['totalLogs'] == 6000000
    assert data['summary']['benignEvents'] > 0
    assert data['summary']['suspiciousEvents'] > 0
    assert data['summary']['maliciousEvents'] > 0
    assert 'protocolStats' in data


def test_api_logs_pagination(client):
    """GET /api/logs returns 200 with paginated log entries and total count"""
    res = client.get('/api/logs?page=1&pageSize=5')
    assert res.status_code == 200
    data = res.get_json()
    assert 'data' in data
    assert len(data['data']) <= 5
    assert data['page'] == 1
    assert data['pageSize'] == 5
    assert data['total'] > 0

    first = data['data'][0]
    for key in ['timestamp', 'source_ip', 'protocol', 'action', 'threat_label', 'severity']:
        assert key in first


def test_api_logs_filtering(client):
    """GET /api/logs filters by protocol and threat_label"""
    res = client.get('/api/logs?protocol=TCP&threat_label=suspicious&pageSize=10')
    assert res.status_code == 200
    data = res.get_json()
    for row in data['data']:
        assert row['protocol'].upper() == 'TCP'
        assert row['threat_label'].lower() == 'suspicious'


def test_api_alerts(client):
    """GET /api/alerts returns only suspicious and malicious events"""
    res = client.get('/api/alerts')
    assert res.status_code == 200
    alerts = res.get_json()
    assert isinstance(alerts, list)
    for alert in alerts[:10]:
        assert alert['threat_label'] in ['suspicious', 'malicious']
        assert alert['severity'] in ['Low', 'Medium', 'High', 'Critical']


def test_api_analyze_valid_sample(client):
    """POST /api/analyze processes valid CSV and returns ML predictions"""
    sample_csv = (
        "timestamp,source_ip,dest_ip,protocol,action,log_type,bytes_transferred,user_agent,request_path,threat_label\n"
        "2024-05-10 10:00:00,187.14.173.168,192.168.1.78,HTTP,allowed,firewall,2538,curl/7.64.1,/api/login?DROP TABLE,malicious\n"
        "2024-06-12 11:00:00,192.168.1.248,192.168.1.15,HTTP,allowed,application,20652,Mozilla/5.0,/login,benign\n"
    )
    data = {
        'file': (io.BytesIO(sample_csv.encode('utf-8')), 'test_logs.csv')
    }
    res = client.post('/api/analyze', data=data, content_type='multipart/form-data')
    assert res.status_code == 200
    res_data = res.get_json()
    assert res_data['processedLogsCount'] == 2
    assert 'results' in res_data
    assert len(res_data['results']) == 2

    row1 = res_data['results'][0]
    assert 'rf_threat_label' in row1
    assert 'svm_threat_label' in row1
    assert 'is_anomaly' in row1
    assert 'severity' in row1
    assert row1['actual_label'] == 'malicious'


def test_api_analyze_missing_columns(client):
    """POST /api/analyze returns 400 when required columns are missing"""
    invalid_csv = (
        "ip_address,status,path\n"
        "192.168.1.1,200,/index.html\n"
    )
    data = {
        'file': (io.BytesIO(invalid_csv.encode('utf-8')), 'invalid.csv')
    }
    res = client.post('/api/analyze', data=data, content_type='multipart/form-data')
    assert res.status_code == 400
    res_data = res.get_json()
    assert 'error' in res_data
    assert 'missing_columns' in res_data
    assert 'protocol' in res_data['missing_columns']
    assert 'action' in res_data['missing_columns']


def test_api_analyze_empty_file(client):
    """POST /api/analyze returns 400 on empty file upload"""
    data = {
        'file': (io.BytesIO(b""), 'empty.csv')
    }
    res = client.post('/api/analyze', data=data, content_type='multipart/form-data')
    assert res.status_code == 400


def test_api_reports_and_export(client):
    """GET /api/reports and /api/reports/export return valid metrics and file bytes"""
    # 1. Reports JSON
    res_reports = client.get('/api/reports')
    assert res_reports.status_code == 200
    reports = res_reports.get_json()
    assert 'supervised_models' in reports

    # 2. Export CSV
    res_csv = client.get('/api/reports/export?format=csv')
    assert res_csv.status_code == 200
    assert 'text/csv' in res_csv.content_type
    assert len(res_csv.data) > 100

    # 3. Export PDF
    res_pdf = client.get('/api/reports/export?format=pdf')
    assert res_pdf.status_code == 200
    assert 'application/pdf' in res_pdf.content_type
    assert len(res_pdf.data) > 100
