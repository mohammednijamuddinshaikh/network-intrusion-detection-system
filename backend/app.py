from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

model = joblib.load("model/ids_model.pkl")
feature_names = joblib.load("model/feature_names.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    features = data.get("features", [])

    if len(features) != len(feature_names):
        return jsonify({"error": f"Expected {len(feature_names)} features"}), 400

    input_array = np.array(features).reshape(1, -1)
    prediction = model.predict(input_array)[0]
    probability = model.predict_proba(input_array)[0].max()

    return jsonify({
        "prediction": "Attack" if prediction == 1 else "Normal",
        "confidence": round(float(probability) * 100, 2)
    })

@app.route("/features", methods=["GET"])
def get_features():
    return jsonify({"features": feature_names})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "running"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)