import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report
from preprocessing import load_raw_dataset, FeatureExtractor, clean_dataframe

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_PATHS = {
    'preprocessor': os.path.join(MODELS_DIR, 'preprocessor.joblib'),
    'random_forest': os.path.join(MODELS_DIR, 'random_forest.joblib'),
    'svm': os.path.join(MODELS_DIR, 'svm.joblib'),
    'isolation_forest': os.path.join(MODELS_DIR, 'isolation_forest.joblib'),
    'metrics': os.path.join(MODELS_DIR, 'metrics.json')
}

def train_and_evaluate_models(sample_size=100000, random_state=42):
    """
    Train ML models on a reproducible 100,000-record stratified sample:
    1. Supervised 3-class Random Forest Classifier (benign, suspicious, malicious)
    2. Supervised 3-class SVM Classifier (benign, suspicious, malicious)
    3. Unsupervised Isolation Forest Anomaly Detector
    
    Evaluates RF and SVM on a 20% held-out test set and saves true calculated metrics.
    Evaluates Isolation Forest for anomaly flag & score statistics without 3-class comparison.
    """
    print(f"=== Starting Model Training Pipeline (Sample Size: {sample_size:,}, Seed: {random_state}) ===")
    
    # 1. Load Stratified Sample Dataset
    print("Loading stratified dataset sample...")
    df_raw_sample = load_raw_dataset(sample_stratified=True, sample_size=sample_size, random_state=random_state)
    df_sample = pd.DataFrame({c: list(df_raw_sample[c]) for c in df_raw_sample.columns})
    print(f"Dataset loaded. Total shape: {df_sample.shape}")
    print("Threat Label Distribution:\n", df_sample['threat_label'].value_counts().to_dict())
    
    X_df = df_sample.drop(columns=['threat_label'])
    y = np.array(df_sample['threat_label'].tolist())
    
    # 2. Stratified Train / Test Split (80% Train, 20% Held-Out Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X_df, y, test_size=0.20, random_state=random_state, stratify=y
    )
    print(f"Train set: {len(X_train):,} samples | Test set: {len(X_test):,} samples")
    
    # 3. Fit Feature Extractor strictly on X_train (Prevent Data Leakage)
    print("Fitting Feature Extractor pipeline on X_train...")
    fe = FeatureExtractor()
    X_train_trans = fe.fit_transform(X_train)
    X_test_trans = fe.transform(X_test)
    print(f"Extracted feature matrix shape: {X_train_trans.shape}")
    
    # 4. Train Random Forest Classifier
    print("\nTraining Random Forest Classifier (3-class supervised)...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=20, random_state=random_state, n_jobs=-1, class_weight='balanced')
    rf.fit(X_train_trans, y_train)
    
    rf_preds = rf.predict(X_test_trans)
    rf_acc = float(accuracy_score(y_test, rf_preds))
    rf_prec, rf_rec, rf_f1, _ = precision_recall_fscore_support(y_test, rf_preds, average='weighted')
    rf_report = classification_report(y_test, rf_preds, output_dict=True)
    print(f"[Random Forest] Test Accuracy: {rf_acc:.4f} | F1 (weighted): {rf_f1:.4f}")
    
    # 5. Train SVM Classifier (Calibrated LinearSVC for probability output)
    print("\nTraining SVM Classifier (3-class supervised)...")
    base_svm = LinearSVC(random_state=random_state, max_iter=2000, dual=False, class_weight='balanced')
    svm = CalibratedClassifierCV(base_svm, cv=3)
    svm.fit(X_train_trans, y_train)
    
    svm_preds = svm.predict(X_test_trans)
    svm_acc = float(accuracy_score(y_test, svm_preds))
    svm_prec, svm_rec, svm_f1, _ = precision_recall_fscore_support(y_test, svm_preds, average='weighted')
    svm_report = classification_report(y_test, svm_preds, output_dict=True)
    print(f"[SVM Classifier] Test Accuracy: {svm_acc:.4f} | F1 (weighted): {svm_f1:.4f}")
    
    # 6. Train Isolation Forest (Unsupervised Anomaly Detection)
    print("\nTraining Isolation Forest (Unsupervised Anomaly Detector)...")
    # Contamination set to approx non-benign fraction (~8%)
    iso = IsolationForest(contamination=0.08, random_state=random_state, n_jobs=-1)
    iso.fit(X_train_trans)
    
    # Evaluate Isolation Forest anomaly scoring on test set
    iso_preds = iso.predict(X_test_trans) # 1 = normal, -1 = anomaly
    iso_scores = iso.decision_function(X_test_trans)
    anomaly_count = int(np.sum(iso_preds == -1))
    normal_count = int(np.sum(iso_preds == 1))
    total_test = len(y_test)
    anomaly_pct = float((anomaly_count / total_test) * 100.0)
    avg_score = float(np.mean(iso_scores))
    print(f"[Isolation Forest] Test Anomalies Flagged: {anomaly_count}/{total_test} ({anomaly_pct:.2f}%) | Avg Score: {avg_score:.4f}")
    
    # 7. Compile Evaluation Metrics JSON (Keeping Supervised & Unsupervised Strictly Separate)
    from sklearn.metrics import confusion_matrix
    eval_classes = ["benign", "suspicious", "malicious"]
    rf_cm = confusion_matrix(y_test, rf_preds, labels=eval_classes).tolist()
    svm_cm = confusion_matrix(y_test, svm_preds, labels=eval_classes).tolist()

    feature_names = fe.column_transformer.get_feature_names_out()
    rf_importances = rf.feature_importances_
    feat_importances = []
    for name, imp in zip(feature_names, rf_importances):
        clean_name = (name.replace('num__', '')
                          .replace('cat__', '')
                          .replace('ua_tfidf__', 'ua:')
                          .replace('path_tfidf__', 'path:'))
        feat_importances.append({"feature": clean_name, "importance": round(float(imp), 4)})
    feat_importances.sort(key=lambda x: x['importance'], reverse=True)
    top_features = feat_importances[:15]

    path_ua_importance = sum(f['importance'] for f in feat_importances if f['feature'].startswith('path:') or f['feature'].startswith('ua:'))
    data_leakage_note = (
        f"Synthetic Dataset Signature Characteristic: The Random Forest model achieves {rf_acc*100:.2f}% test accuracy. "
        f"URI request path and user-agent string tokens explain {path_ua_importance*100:.1f}% of total feature importance. "
        "Threat categories in this dataset are strongly correlated with signature heuristics "
        "(e.g., 'DROP TABLE', 'sqlmap', '/etc/passwd'). Real-world production SOC models require periodic retraining "
        "on diverse traffic to prevent signature overfitting."
    )

    metrics_data = {
        "metadata": {
            "training_sample_size": sample_size,
            "test_sample_size": len(y_test),
            "random_state": random_state,
            "classes": eval_classes,
            "note": "100,000-record uniform sample across entire 6,000,000-record dataset used for reproducible model training.",
            "data_leakage_note": data_leakage_note
        },
        "supervised_models": {
            "random_forest": {
                "model_name": "Random Forest Classifier",
                "accuracy": round(rf_acc, 4),
                "precision": round(float(rf_prec), 4),
                "recall": round(float(rf_rec), 4),
                "f1_score": round(float(rf_f1), 4),
                "confusion_matrix": {
                    "labels": eval_classes,
                    "matrix": rf_cm
                },
                "feature_importances": top_features,
                "class_report": rf_report
            },
            "svm": {
                "model_name": "Support Vector Machine (LinearSVC)",
                "accuracy": round(svm_acc, 4),
                "precision": round(float(svm_prec), 4),
                "recall": round(float(svm_rec), 4),
                "f1_score": round(float(svm_f1), 4),
                "confusion_matrix": {
                    "labels": eval_classes,
                    "matrix": svm_cm
                },
                "class_report": svm_report
            }
        },
        "feature_importances": top_features,
        "unsupervised_anomaly_detection": {
            "model_name": "Isolation Forest",
            "type": "Unsupervised Anomaly Detector",
            "note": "Isolation Forest performs unsupervised out-of-distribution anomaly detection, returning anomaly flags and decision scores rather than 3-class threat labels.",
            "test_total_samples": total_test,
            "anomalies_flagged": anomaly_count,
            "normals_flagged": normal_count,
            "anomaly_rate_percent": round(anomaly_pct, 2),
            "mean_anomaly_score": round(avg_score, 4)
        }
    }
    
    # 8. Save Models & Metrics to Disk
    print("\nSaving fitted pipeline models and metrics to disk...")
    joblib.dump(fe, MODEL_PATHS['preprocessor'])
    joblib.dump(rf, MODEL_PATHS['random_forest'])
    joblib.dump(svm, MODEL_PATHS['svm'])
    joblib.dump(iso, MODEL_PATHS['isolation_forest'])
    
    with open(MODEL_PATHS['metrics'], 'w') as f:
        json.dump(metrics_data, f, indent=2)
        
    print("=== Model Training Completed Successfully! ===")
    return metrics_data

class ThreatInferenceEngine:
    """
    Inference Engine class to load saved models and run predictions on incoming log records.
    """
    def __init__(self):
        self.preprocessor = None
        self.rf_model = None
        self.svm_model = None
        self.iso_model = None
        self.metrics = None
        self.loaded = False
        self.load_models()

    def load_models(self):
        required_paths = [
            MODEL_PATHS['preprocessor'],
            MODEL_PATHS['random_forest'],
            MODEL_PATHS['svm'],
            MODEL_PATHS['isolation_forest']
        ]
        missing = [p for p in required_paths if not os.path.exists(p)]
        if missing:
            missing_names = [os.path.basename(p) for p in missing]
            print(f"[ThreatInferenceEngine] Warning: ML models not found ({', '.join(missing_names)}).")
            print("[ThreatInferenceEngine] Models will NOT be trained at startup. To train them, run: python model.py")
            self.loaded = False
            return False

        try:
            self.preprocessor = joblib.load(MODEL_PATHS['preprocessor'])
            self.rf_model = joblib.load(MODEL_PATHS['random_forest'])
            self.svm_model = joblib.load(MODEL_PATHS['svm'])
            self.iso_model = joblib.load(MODEL_PATHS['isolation_forest'])
            
            if os.path.exists(MODEL_PATHS['metrics']):
                with open(MODEL_PATHS['metrics'], 'r') as f:
                    self.metrics = json.load(f)
                    
            self.loaded = True
            print("[ThreatInferenceEngine] All ML models and preprocessor loaded successfully.")
            return True
        except Exception as e:
            print(f"[ThreatInferenceEngine] Error loading models: {e}")
            self.loaded = False
            return False

    def predict_logs(self, df):
        """
        Run preprocessing and inference across dataframe records.
        Returns array of prediction dicts containing 3-class RF prediction, 3-class SVM prediction,
        and Isolation Forest anomaly flag + decision score.
        """
        if not self.loaded:
            if not self.load_models():
                raise RuntimeError("ML models are not loaded. Run 'python model.py' to train models first.")

        df_clean = clean_dataframe(df)
        X_trans = self.preprocessor.transform(df_clean)
        
        rf_preds = self.rf_model.predict(X_trans)
        rf_probs = self.rf_model.predict_proba(X_trans)
        svm_preds = self.svm_model.predict(X_trans)
        
        iso_preds = self.iso_model.predict(X_trans) # 1 = normal, -1 = anomaly
        iso_scores = self.iso_model.decision_function(X_trans)
        
        classes = self.rf_model.classes_

        has_actual = 'threat_label' in df.columns
        actual_labels = [str(x).lower() for x in df['threat_label']] if has_actual else None

        results = []
        for i in range(len(df_clean)):
            rf_label = str(rf_preds[i])
            rf_conf = float(np.max(rf_probs[i]))
            svm_label = str(svm_preds[i])
            is_anomaly = bool(iso_preds[i] == -1)
            anom_score = float(iso_scores[i])

            # Label leakage fix: final_threat_label is ALWAYS the RF prediction
            record = {
                'rf_threat_label': rf_label,
                'rf_confidence': round(rf_conf, 4),
                'svm_threat_label': svm_label,
                'is_anomaly': is_anomaly,
                'anomaly_score': round(anom_score, 4),
                'final_threat_label': rf_label
            }

            if has_actual:
                record['actual_label'] = actual_labels[i]

            results.append(record)

        return results

if __name__ == '__main__':
    print("=" * 70)
    print("Executing offline model training pipeline via python model.py...")
    print("Training Random Forest (3-class), SVM (LinearSVC), and Isolation Forest...")
    print("=" * 70)
    train_and_evaluate_models()
    print("=" * 70)
    print("Model training completed successfully! Model artifacts saved to backend/models/")
    print("=" * 70)
