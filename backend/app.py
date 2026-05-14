from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

model         = joblib.load("model/ids_model.pkl")
le_label      = joblib.load("model/label_encoder.pkl")
feature_names = joblib.load("model/feature_names.pkl")

CATEGORY_META = {
    "Normal": {"color": "green",  "icon": "✅"},
    "DoS":    {"color": "red",    "icon": "💥"},
    "Probe":  {"color": "orange", "icon": "🔍"},
    "R2L":    {"color": "purple", "icon": "🔓"},
    "U2R":    {"color": "yellow", "icon": "⚠️"},
}

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    features = data.get("features", [])

    if len(features) != len(feature_names):
        return jsonify({"error": f"Expected {len(feature_names)} features"}), 400

    input_array = np.array(features).reshape(1, -1)
    prediction  = le_label.inverse_transform(model.predict(input_array))[0]
    proba       = model.predict_proba(input_array)[0]
    confidence  = round(float(proba.max()) * 100, 2)

    all_probs = {
        le_label.inverse_transform([i])[0]: round(float(p) * 100, 2)
        for i, p in enumerate(proba)
    }

    return jsonify({
        "prediction": prediction,
        "confidence": confidence,
        "probabilities": all_probs,
        "meta": CATEGORY_META.get(prediction, {})
    })

@app.route("/features", methods=["GET"])
def get_features():
    return jsonify({"features": feature_names})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "running"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)