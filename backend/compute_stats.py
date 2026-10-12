import os
import sys
import json
import time
import pandas as pd
import numpy as np

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from preprocessing import get_dataset_path, clean_dataframe

def compute_and_cache_dataset_stats(cache_dir=None, sample_size=100000, random_state=42):
    """
    Read the ~6,000,000-row CSV in chunks (pd.read_csv chunksize) without loading the entire
    874 MB file into memory at once.
    Calculates exact real metrics:
    - Total logs
    - Threat counts (benign, suspicious, malicious)
    - Severity counts (Low, Medium, High, Critical)
    - Logs over time (12 months)
    - Protocol distributions
    - Log type distributions
    - Action distributions
    Also extracts a uniform random sample of sample_size records across all chunks
    and caches to backend/cache/stats.json and backend/cache/sample_records.csv.
    """
    if cache_dir is None:
        cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache')
    os.makedirs(cache_dir, exist_ok=True)
    stats_file = os.path.join(cache_dir, 'stats.json')
    sample_file = os.path.join(cache_dir, 'sample_records.csv')

    dataset_path = get_dataset_path()
    print(f"Aggregating dataset from: {dataset_path}")
    start_time = time.time()

    total_records = 0
    threat_counts = {'benign': 0, 'suspicious': 0, 'malicious': 0}
    sev_counts = {'Low': 0, 'Medium': 0, 'High': 0, 'Critical': 0}
    protocol_counts = {}
    log_type_counts = {}
    action_counts = {}
    monthly_threats = {m: {'benign': 0, 'suspicious': 0, 'malicious': 0} for m in range(1, 13)}

    # Reservoir / uniform chunk sampling
    rng = np.random.RandomState(random_state)
    sample_chunks = []
    # With ~6,000,000 rows, sampling fraction is ~ sample_size / 6,000,000
    chunk_size = 500000
    approx_total = 6000000
    chunk_sample_target = int(sample_size * (chunk_size / approx_total) * 1.05)

    chunk_idx = 0
    for chunk in pd.read_csv(dataset_path, chunksize=chunk_size):
        chunk_idx += 1
        chunk_len = len(chunk)
        total_records += chunk_len

        # 1. Threat distribution
        threat_series = chunk['threat_label'].fillna('benign').astype(str).str.lower()
        tc = threat_series.value_counts().to_dict()
        for k, v in tc.items():
            if k in threat_counts:
                threat_counts[k] += int(v)

        # 2. Protocols
        proto_series = chunk['protocol'].fillna('UNKNOWN').astype(str).str.upper()
        for k, v in proto_series.value_counts().to_dict().items():
            protocol_counts[k] = protocol_counts.get(k, 0) + int(v)

        # 3. Log types
        lt_series = chunk['log_type'].fillna('application').astype(str).str.lower()
        for k, v in lt_series.value_counts().to_dict().items():
            log_type_counts[k] = log_type_counts.get(k, 0) + int(v)

        # 4. Actions
        act_series = chunk['action'].fillna('allowed').astype(str).str.lower()
        for k, v in act_series.value_counts().to_dict().items():
            action_counts[k] = action_counts.get(k, 0) + int(v)

        # 5. Monthly breakdown
        months = pd.to_datetime(chunk['timestamp'].fillna('2024-01-01'), errors='coerce').dt.month.fillna(1).astype(int)
        for (m, t), count in pd.crosstab(months, threat_series).stack().items():
            if m in monthly_threats and t in monthly_threats[m]:
                monthly_threats[m][t] += int(count)

        # 6. Vectorized severity classification (matching compute_derived_severity)
        ua_lower = chunk['user_agent'].fillna('').astype(str).str.lower()
        path_lower = chunk['request_path'].fillna('').astype(str).str.lower()
        is_crit = (act_series == 'allowed') | path_lower.str.contains('drop table', regex=False) | ua_lower.str.contains('sqlmap', regex=False) | path_lower.str.contains('passwd', regex=False)

        conditions = [
            threat_series == 'benign',
            (threat_series == 'suspicious') & (act_series == 'blocked'),
            (threat_series == 'suspicious') & (act_series != 'blocked'),
            (threat_series == 'malicious') & is_crit,
            (threat_series == 'malicious') & ~is_crit
        ]
        choices = ['Low', 'Medium', 'High', 'Critical', 'High']
        sevs = np.select(conditions, choices, default='Low')
        for k, v in pd.Series(sevs).value_counts().to_dict().items():
            sev_counts[k] = sev_counts.get(k, 0) + int(v)

        # 7. Take random slice from chunk for uniform full-dataset sampling
        n_to_sample = min(len(chunk), chunk_sample_target)
        sampled_rows = chunk.sample(n=n_to_sample, random_state=rng)
        sample_chunks.append(sampled_rows)

        print(f"Processed chunk {chunk_idx}: {total_records:,} rows ({time.time() - start_time:.1f}s)")

    # Consolidate random sample
    full_sample = pd.concat(sample_chunks, ignore_index=True)
    if len(full_sample) > sample_size:
        full_sample = full_sample.sample(n=sample_size, random_state=rng).reset_index(drop=True)
    full_sample.to_csv(sample_file, index=False)
    print(f"Cached {len(full_sample):,} randomly sampled records across entire dataset to: {sample_file}")

    # Format monthly timeline
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    logs_over_time = [
        {
            'time': month_names[m-1],
            'benign': monthly_threats[m]['benign'],
            'suspicious': monthly_threats[m]['suspicious'],
            'malicious': monthly_threats[m]['malicious']
        }
        for m in range(1, 13)
    ]

    stats_data = {
        'summary': {
            'totalLogs': total_records,
            'benignEvents': threat_counts['benign'],
            'suspiciousEvents': threat_counts['suspicious'],
            'maliciousEvents': threat_counts['malicious'],
            'activeAlerts': threat_counts['suspicious'] + threat_counts['malicious']
        },
        'severitySummary': {
            'Low': sev_counts['Low'],
            'Medium': sev_counts['Medium'],
            'High': sev_counts['High'],
            'Critical': sev_counts['Critical']
        },
        'logsOverTime': logs_over_time,
        'threatDistribution': [
            {'name': 'Benign', 'value': threat_counts['benign']},
            {'name': 'Suspicious', 'value': threat_counts['suspicious']},
            {'name': 'Malicious', 'value': threat_counts['malicious']}
        ],
        'protocolStats': [{'name': k, 'count': v} for k, v in sorted(protocol_counts.items(), key=lambda x: -x[1])],
        'logTypeDistribution': [{'name': k.capitalize(), 'value': v} for k, v in sorted(log_type_counts.items(), key=lambda x: -x[1])],
        'actionStats': [{'name': k.capitalize(), 'value': v} for k, v in sorted(action_counts.items(), key=lambda x: -x[1])]
    }

    with open(stats_file, 'w') as f:
        json.dump(stats_data, f, indent=2)

    elapsed = time.time() - start_time
    print(f"Stats calculation complete in {elapsed:.1f}s! Cached to {stats_file}")
    print(f"Totals check: Total={total_records:,} | Threats Sum={sum(threat_counts.values()):,} | Severity Sum={sum(sev_counts.values()):,}")
    return stats_data

if __name__ == '__main__':
    compute_and_cache_dataset_stats()
