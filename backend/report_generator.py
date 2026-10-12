import io
import csv
import json
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_csv_report(stats=None, metrics=None):
    """
    Generate downloadable CSV report summarizing dataset statistics and ML model metrics.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    # 1. Header
    writer.writerow(["INTELLIGENT LOG ANALYSIS AND THREAT DETECTION - SECURITY REPORT"])
    writer.writerow([])

    # 2. Dataset Summary
    writer.writerow(["--- 1. DATASET TELEMETRY SUMMARY ---"])
    if stats and 'summary' in stats:
        summary = stats['summary']
        writer.writerow(["Metric", "Count", "Percentage"])
        total = summary.get('totalLogs', 0)
        benign = summary.get('benignEvents', 0)
        suspicious = summary.get('suspiciousEvents', 0)
        malicious = summary.get('maliciousEvents', 0)
        active = summary.get('activeAlerts', 0)
        writer.writerow(["Total Logs Indexed", total, "100.00%"])
        writer.writerow(["Benign Events", benign, f"{(benign/total*100):.2f}%" if total else "0%"])
        writer.writerow(["Suspicious Events", suspicious, f"{(suspicious/total*100):.2f}%" if total else "0%"])
        writer.writerow(["Malicious Events", malicious, f"{(malicious/total*100):.2f}%" if total else "0%"])
        writer.writerow(["Active Incident Alerts", active, f"{(active/total*100):.2f}%" if total else "0%"])
    writer.writerow([])

    # 3. Severity Distribution
    writer.writerow(["--- 2. OPERATIONAL SEVERITY DISTRIBUTION (DERIVED) ---"])
    if stats and 'severitySummary' in stats:
        writer.writerow(["Severity Tier", "Count"])
        for k, v in stats['severitySummary'].items():
            writer.writerow([k, v])
    writer.writerow([])

    # 4. Supervised ML Model Comparison
    writer.writerow(["--- 3. SUPERVISED MACHINE LEARNING MODEL EVALUATION ---"])
    if metrics and 'supervised_models' in metrics:
        sup = metrics['supervised_models']
        writer.writerow(["Model Name", "Accuracy", "Precision", "Recall", "F1 Score"])
        for m_key, m_val in sup.items():
            writer.writerow([
                m_val.get('model_name', m_key),
                m_val.get('accuracy', 0),
                m_val.get('precision', 0),
                m_val.get('recall', 0),
                m_val.get('f1_score', 0)
            ])
    writer.writerow([])

    # 5. Confusion Matrices
    writer.writerow(["--- 4. CONFUSION MATRICES ---"])
    if metrics and 'supervised_models' in metrics:
        for m_key in ['random_forest', 'svm']:
            m_val = metrics['supervised_models'].get(m_key, {})
            cm = m_val.get('confusion_matrix', {})
            labels = cm.get('labels', ['benign', 'suspicious', 'malicious'])
            mat = cm.get('matrix', [])
            if mat:
                writer.writerow([f"{m_val.get('model_name', m_key)} (Predicted ->)"] + labels)
                for r_idx, row in enumerate(mat):
                    writer.writerow([f"Actual: {labels[r_idx]}"] + row)
                writer.writerow([])

    # 6. Feature Importances
    writer.writerow(["--- 5. RANDOM FOREST TOP FEATURE IMPORTANCES ---"])
    feat_imps = metrics.get('feature_importances', []) if metrics else []
    if feat_imps:
        writer.writerow(["Rank", "Feature Name", "Importance Score"])
        for idx, item in enumerate(feat_imps[:15], 1):
            writer.writerow([idx, item.get('feature', ''), item.get('importance', 0)])
    writer.writerow([])

    # 7. Isolation Forest Unsupervised Anomaly Detection
    writer.writerow(["--- 6. UNSUPERVISED ISOLATION FOREST ANOMALY DETECTION ---"])
    if metrics and 'unsupervised_anomaly_detection' in metrics:
        iso = metrics['unsupervised_anomaly_detection']
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Samples Evaluated", iso.get('test_total_samples', 0)])
        writer.writerow(["Anomalies Flagged", iso.get('anomalies_flagged', 0)])
        writer.writerow(["Normal Records", iso.get('normals_flagged', 0)])
        writer.writerow(["Anomaly Rate (%)", iso.get('anomaly_rate_percent', 0)])
        writer.writerow(["Mean Anomaly Decision Score", iso.get('mean_anomaly_score', 0)])
    writer.writerow([])

    return output.getvalue().encode('utf-8')

def generate_pdf_report(stats=None, metrics=None):
    """
    Generate downloadable PDF report using reportlab.
    Clean, professional design with consistent data tables.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("Intelligent Log Analysis & Threat Detection", title_style))
    story.append(Paragraph("Security Telemetry & Machine Learning Evaluation Report (6,000,000 Records)", subtitle_style))
    story.append(Spacer(1, 8))

    # 1. Dataset Telemetry Summary
    story.append(Paragraph("1. Dataset Telemetry Summary", h2_style))
    if stats and 'summary' in stats:
        summary = stats['summary']
        tot = summary.get('totalLogs', 0)
        ben = summary.get('benignEvents', 0)
        sus = summary.get('suspiciousEvents', 0)
        mal = summary.get('maliciousEvents', 0)

        data = [
            ["Metric", "Record Count", "Percentage"],
            ["Total Logs Indexed", f"{tot:,}", "100.00%"],
            ["Benign Events", f"{ben:,}", f"{(ben/tot*100):.2f}%" if tot else "0%"],
            ["Suspicious Events", f"{sus:,}", f"{(sus/tot*100):.2f}%" if tot else "0%"],
            ["Malicious Events", f"{mal:,}", f"{(mal/tot*100):.2f}%" if tot else "0%"],
            ["Active Alerts (Suspicious + Malicious)", f"{(sus + mal):,}", f"{((sus+mal)/tot*100):.2f}%" if tot else "0%"]
        ]
        t = Table(data, colWidths=[240, 150, 150])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        story.append(t)
    story.append(Spacer(1, 10))

    # 2. Supervised ML Models Comparison
    story.append(Paragraph("2. Supervised Machine Learning Model Performance", h2_style))
    if metrics and 'supervised_models' in metrics:
        sup = metrics['supervised_models']
        data = [["Model", "Accuracy", "Precision", "Recall", "F1 Score"]]
        for m_key in ['random_forest', 'svm']:
            m_val = sup.get(m_key, {})
            data.append([
                m_val.get('model_name', m_key),
                f"{m_val.get('accuracy', 0)*100:.2f}%",
                f"{m_val.get('precision', 0)*100:.2f}%",
                f"{m_val.get('recall', 0)*100:.2f}%",
                f"{m_val.get('f1_score', 0):.4f}"
            ])
        t = Table(data, colWidths=[180, 90, 90, 90, 90])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        story.append(t)
    story.append(Spacer(1, 10))

    # 3. Confusion Matrix
    story.append(Paragraph("3. Confusion Matrices (Evaluated on 20,000 Held-Out Test Records)", h2_style))
    if metrics and 'supervised_models' in metrics:
        sup = metrics['supervised_models']
        rf_cm = sup.get('random_forest', {}).get('confusion_matrix', {})
        mat = rf_cm.get('matrix', [])
        labels = rf_cm.get('labels', ['benign', 'suspicious', 'malicious'])
        if mat:
            cm_data = [["Actual \\ Predicted", f"Pred: {labels[0]}", f"Pred: {labels[1]}", f"Pred: {labels[2]}"]]
            for idx, row in enumerate(mat):
                cm_data.append([f"Actual: {labels[idx]}"] + [f"{cnt:,}" for cnt in row])
            t = Table(cm_data, colWidths=[150, 130, 130, 130])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ]))
            story.append(t)
    story.append(Spacer(1, 10))

    # 4. Top Feature Importances & Data Leakage Note
    story.append(Paragraph("4. Random Forest Feature Importance & Synthetic Data Signature Note", h2_style))
    feat_imps = metrics.get('feature_importances', []) if metrics else []
    if feat_imps:
        data = [["Rank", "Feature Name", "Importance"]]
        for idx, item in enumerate(feat_imps[:8], 1):
            data.append([str(idx), item.get('feature', ''), f"{item.get('importance', 0):.4f}"])
        t = Table(data, colWidths=[60, 360, 120])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        story.append(t)

    leak_note = metrics.get('metadata', {}).get('data_leakage_note', '') if metrics else ''
    if leak_note:
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"<b>Data Characteristic Analysis:</b> {leak_note}", body_style))

    story.append(Spacer(1, 10))

    # 5. Isolation Forest Unsupervised Anomaly Detection
    story.append(Paragraph("5. Isolation Forest (Unsupervised Anomaly Detection)", h2_style))
    if metrics and 'unsupervised_anomaly_detection' in metrics:
        iso = metrics['unsupervised_anomaly_detection']
        data = [
            ["Metric", "Value"],
            ["Total Test Samples", f"{iso.get('test_total_samples', 0):,}"],
            ["Anomalies Flagged", f"{iso.get('anomalies_flagged', 0):,} ({iso.get('anomaly_rate_percent', 0):.2f}%)"],
            ["Normal Records", f"{iso.get('normals_flagged', 0):,}"],
            ["Mean Anomaly Score", f"{iso.get('mean_anomaly_score', 0):.4f}"]
        ]
        t = Table(data, colWidths=[300, 240])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        story.append(t)

    doc.build(story)
    return buf.getvalue()
