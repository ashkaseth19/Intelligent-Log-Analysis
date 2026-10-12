import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer

DATASET_PATHS = [
    os.path.join(os.path.dirname(__file__), '..', 'data', 'cybersecurity_threat_detection_logs.csv'),
    os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'cybersecurity_threat_detection_logs.csv'),
    'data/cybersecurity_threat_detection_logs.csv',
    'src/data/cybersecurity_threat_detection_logs.csv'
]

def get_dataset_path():
    """Find and return valid path to the dataset CSV file. Supports DATASET_PATH env var."""
    env_path = os.environ.get('DATASET_PATH')
    if env_path:
        abs_env = os.path.abspath(env_path)
        if os.path.exists(abs_env):
            return abs_env
        print(f"Warning: DATASET_PATH environment variable set to '{env_path}' but file was not found. Falling back to default paths.")

    for path in DATASET_PATHS:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            return abs_path
    raise FileNotFoundError("Could not locate cybersecurity_threat_detection_logs.csv in DATASET_PATH, /data or /src/data.")

def load_raw_dataset(nrows=None, sample_stratified=False, sample_size=100000, random_state=42):
    """
    Load dataset from CSV or cached full-dataset random sample.
    If sample_stratified is True, loads a uniform 100,000-record sample drawn from across
    the entire 6M dataset (from backend/cache/sample_records.csv if available).
    """
    cache_sample = os.path.join(os.path.dirname(__file__), 'cache', 'sample_records.csv')
    if sample_stratified and os.path.exists(cache_sample):
        df = pd.read_csv(cache_sample, nrows=sample_size)
        return clean_dataframe(df)

    path = get_dataset_path()
    if not sample_stratified:
        df = pd.read_csv(path, nrows=nrows)
        return clean_dataframe(df)

    # Chunked uniform sampling across the entire file if cache is not yet generated
    rng = np.random.RandomState(random_state)
    sample_chunks = []
    chunk_size = 500000
    approx_total = 6000000
    chunk_target = int(sample_size * (chunk_size / approx_total) * 1.05)

    for chunk in pd.read_csv(path, chunksize=chunk_size):
        sampled = chunk.sample(n=min(len(chunk), chunk_target), random_state=rng)
        sample_chunks.append(sampled)

    full_sample = pd.concat(sample_chunks, ignore_index=True)
    if len(full_sample) > sample_size:
        full_sample = full_sample.sample(n=sample_size, random_state=rng)
    return clean_dataframe(full_sample.reset_index(drop=True))

def clean_dataframe(df):
    """
    Clean raw dataframe: fill missing values, cast data types, remove duplicates where appropriate.
    Does not modify original dataset on disk.
    Converts PyArrow extension arrays to standard native Python objects & NumPy arrays for filtering & Scikit-Learn indexing.
    """
    df_clean = pd.DataFrame()

    # Handle potential missing values in columns and convert to native python lists
    df_clean['timestamp'] = np.array(df['timestamp'].fillna('2024-01-01T00:00:00').astype(str).tolist(), dtype=object)
    df_clean['source_ip'] = np.array(df['source_ip'].fillna('0.0.0.0').astype(str).tolist(), dtype=object)
    df_clean['dest_ip'] = np.array(df['dest_ip'].fillna('0.0.0.0').astype(str).tolist(), dtype=object)
    df_clean['protocol'] = np.array(df['protocol'].fillna('UNKNOWN').astype(str).str.upper().tolist(), dtype=object)
    df_clean['action'] = np.array(df['action'].fillna('allowed').astype(str).str.lower().tolist(), dtype=object)
    df_clean['log_type'] = np.array(df['log_type'].fillna('application').astype(str).str.lower().tolist(), dtype=object)
    df_clean['bytes_transferred'] = np.array(pd.to_numeric(df['bytes_transferred'], errors='coerce').fillna(0).astype(int).tolist(), dtype=int)
    df_clean['user_agent'] = np.array(df['user_agent'].fillna('Unknown').astype(str).tolist(), dtype=object)
    df_clean['request_path'] = np.array(df['request_path'].fillna('/').astype(str).tolist(), dtype=object)

    if 'threat_label' in df.columns:
        df_clean['threat_label'] = np.array(df['threat_label'].fillna('benign').astype(str).str.lower().tolist(), dtype=object)

    return df_clean

def compute_derived_severity(threat_label, action='allowed', user_agent='', request_path=''):
    """
    Compute rule-based derived severity.
    NOTE: Severity is NOT a ground-truth field in the dataset CSV.
    This function generates a derived operational severity tier for SOC UI triage display.
    """
    threat = str(threat_label).lower()
    act = str(action).lower()
    ua = str(user_agent).lower()
    path = str(request_path).lower()

    if threat == 'benign':
        return 'Low'
    elif threat == 'suspicious':
        if act == 'blocked':
            return 'Medium'
        return 'High'
    elif threat == 'malicious':
        if act == 'allowed' or 'drop table' in path or 'sqlmap' in ua or 'passwd' in path:
            return 'Critical'
        return 'High'
    return 'Low'

def compute_derived_severity_vectorized(df, threat_series=None):
    """
    Vectorized calculation of derived operational severity tier across pandas Series / DataFrame.
    Matches compute_derived_severity 100% while executing significantly faster.
    """
    if threat_series is None:
        threat_series = df.get('threat_label', pd.Series('benign', index=df.index)).fillna('benign').astype(str).str.lower()
    else:
        threat_series = pd.Series(threat_series, index=df.index).fillna('benign').astype(str).str.lower()

    act_series = df.get('action', pd.Series('allowed', index=df.index)).fillna('allowed').astype(str).str.lower()
    ua_lower = df.get('user_agent', pd.Series('', index=df.index)).fillna('').astype(str).str.lower()
    path_lower = df.get('request_path', pd.Series('', index=df.index)).fillna('').astype(str).str.lower()

    is_crit = (act_series == 'allowed') | path_lower.str.contains('drop table', regex=False) | ua_lower.str.contains('sqlmap', regex=False) | path_lower.str.contains('passwd', regex=False)

    conditions = [
        threat_series == 'benign',
        (threat_series == 'suspicious') & (act_series == 'blocked'),
        (threat_series == 'suspicious') & (act_series != 'blocked'),
        (threat_series == 'malicious') & is_crit,
        (threat_series == 'malicious') & ~is_crit
    ]
    choices = ['Low', 'Medium', 'High', 'Critical', 'High']
    return np.select(conditions, choices, default='Low')

def generate_log_explanation(row):
    """
    Generate contextual narrative explanation for why a log was categorized.
    Used by detail inspection modals.
    """
    threat = str(row.get('threat_label', 'benign')).lower()
    action = str(row.get('action', 'allowed')).lower()
    ua = str(row.get('user_agent', ''))
    path = str(row.get('request_path', ''))
    protocol = str(row.get('protocol', ''))
    bytes_val = row.get('bytes_transferred', 0)
    log_type = str(row.get('log_type', ''))

    if threat == 'malicious':
        if 'DROP TABLE' in path.upper() or 'SELECT' in path.upper() or 'SQLMAP' in ua.upper():
            return f"Critical SQL injection probe detected in {protocol} URI request parameter payload via {log_type}."
        if 'passwd' in path or '..' in path:
            return f"Confirmed malicious directory path traversal attempt aiming to access protected host configuration."
        return f"Malicious attack signature flagged by security models with enforcement action '{action}'."
    
    if threat == 'suspicious':
        if 'Nmap' in ua or 'Hydra' in ua or 'curl' in ua:
            return f"Suspicious automated scanner tool signature ('{ua}') detected performing perimeter reconnaissance."
        if bytes_val > 30000:
            return f"Anomalous high-volume data transmission ({bytes_val:,} bytes) flagged for secondary SOC review."
        return f"Suspicious traffic pattern matching threat heuristics on protocol {protocol} ({action})."

    return f"Standard benign operational traffic observed through {log_type} telemetry."

class FeatureExtractor(BaseEstimator, TransformerMixin):
    """
    Custom Scikit-Learn Pipeline Feature Extractor that builds numerical vectors
    from real dataset columns:
    - bytes_transferred (log1p transformed & scaled)
    - protocol (one-hot)
    - action (one-hot)
    - log_type (one-hot)
    - user_agent (TF-IDF sub-vector)
    - request_path (TF-IDF sub-vector)
    - timestamp derived features (hour of day, month)
    """
    def __init__(self):
        self.column_transformer = None

    def fit(self, X, y=None):
        X_df = clean_dataframe(X)
        
        # Engineer temporal features
        X_feats = self._prepare_features_df(X_df)
        
        self.column_transformer = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), ['bytes_transferred_log', 'hour', 'month']),
                ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), ['protocol', 'action', 'log_type']),
                ('ua_tfidf', TfidfVectorizer(max_features=100, token_pattern=r'(?u)\b\w+\b'), 'user_agent'),
                ('path_tfidf', TfidfVectorizer(max_features=100, token_pattern=r'(?u)\b\w+\b'), 'request_path')
            ]
        )
        self.column_transformer.fit(X_feats)
        return self

    def transform(self, X):
        X_df = clean_dataframe(X)
        X_feats = self._prepare_features_df(X_df)
        return self.column_transformer.transform(X_feats)

    def _prepare_features_df(self, df):
        df_feats = df.copy()
        df_feats['bytes_transferred_log'] = np.log1p(df_feats['bytes_transferred'].values)
        
        # Parse timestamp safely
        ts_dt = pd.to_datetime(df_feats['timestamp'], errors='coerce')
        df_feats['hour'] = ts_dt.dt.hour.fillna(0).astype(float)
        df_feats['month'] = ts_dt.dt.month.fillna(1).astype(float)
        
        return df_feats[['bytes_transferred_log', 'hour', 'month', 'protocol', 'action', 'log_type', 'user_agent', 'request_path']]
