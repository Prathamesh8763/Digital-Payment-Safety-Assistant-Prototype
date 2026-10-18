import os
import json
import sys
from typing import Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from schemas.safety import TextCheckRequest, EvaluationMetrics
from safety.engine import SafetyEngine

def run_benchmark_evaluation() -> Dict[str, Any]:
    dataset_path = os.path.join(os.path.dirname(__file__), "evaluation_dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        samples = json.load(f)

    engine = SafetyEngine()
    total = len(samples)
    correct = 0
    true_positives = 0
    false_positives = 0
    true_negatives = 0
    false_negatives = 0

    category_results: Dict[str, Dict[str, int]] = {}
    language_results: Dict[str, Dict[str, int]] = {}

    for item in samples:
        expected = item["expected_risk"]
        cat = item.get("category", "General")
        lang = item.get("language", "en")

        if cat not in category_results:
            category_results[cat] = {"total": 0, "correct": 0}
        category_results[cat]["total"] += 1

        if lang not in language_results:
            language_results[lang] = {"total": 0, "correct": 0}
        language_results[lang]["total"] += 1

        req = TextCheckRequest(text=item["text"], language=lang)
        res = engine.analyze_text(req)
        actual = res.risk_level

        # Exact match logic
        is_match = (actual == expected)
        if is_match:
            correct += 1
            category_results[cat]["correct"] += 1
            language_results[lang]["correct"] += 1

        # Binary classification view (Scam/Suspicious: HIGH/MEDIUM vs Legitimate: LOW)
        is_expected_scam = expected in ["HIGH", "MEDIUM"]
        is_predicted_scam = actual in ["HIGH", "MEDIUM"]

        if is_expected_scam and is_predicted_scam:
            true_positives += 1
        elif not is_expected_scam and is_predicted_scam:
            false_positives += 1
        elif not is_expected_scam and not is_predicted_scam:
            true_negatives += 1
        elif is_expected_scam and not is_predicted_scam:
            false_negatives += 1

    accuracy = (correct / total) * 100 if total else 0.0
    precision = (true_positives / (true_positives + false_positives) * 100) if (true_positives + false_positives) else 100.0
    recall = (true_positives / (true_positives + false_negatives) * 100) if (true_positives + false_negatives) else 100.0
    fpr = (false_positives / (false_positives + true_negatives) * 100) if (false_positives + true_negatives) else 0.0
    fnr = (false_negatives / (true_positives + false_negatives) * 100) if (true_positives + false_negatives) else 0.0

    return {
        "total_samples": total,
        "accuracy_percentage": round(accuracy, 2),
        "precision_percentage": round(precision, 2),
        "recall_percentage": round(recall, 2),
        "false_positive_rate": round(fpr, 2),
        "false_negative_rate": round(fnr, 2),
        "scam_detection_rate": round(recall, 2),
        "legitimate_preservation_rate": round(100.0 - fpr, 2),
        "details_by_category": category_results,
        "details_by_language": language_results,
        "evaluation_version": "V3.0"
    }

if __name__ == "__main__":
    report = run_benchmark_evaluation()
    print("=" * 65)
    print("DIGITAL PAYMENT SAFETY ASSISTANT - V3 BENCHMARK EVALUATION")
    print("=" * 65)
    print(f"Total Test Samples:          {report['total_samples']}")
    print(f"Accuracy:                    {report['accuracy_percentage']}%")
    print(f"Precision:                   {report['precision_percentage']}%")
    print(f"Recall (Scam Detection):     {report['recall_percentage']}%")
    print(f"False Positive Rate:         {report['false_positive_rate']}%")
    print(f"False Negative Rate:         {report['false_negative_rate']}%")
    print(f"Legitimate Safe Rate:        {report['legitimate_preservation_rate']}%")
    print("\nResults by Category:")
    for cat, stats in report["details_by_category"].items():
        print(f"  • {cat:<32} {stats['correct']}/{stats['total']} correct")
    print("\nResults by Language:")
    for lang, stats in report["details_by_language"].items():
        print(f"  • {lang:<12} {stats['correct']}/{stats['total']} correct")
    print("=" * 65)
