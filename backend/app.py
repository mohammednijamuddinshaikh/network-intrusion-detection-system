from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required
import joblib
import numpy as np
import queue
import json
from auth import auth_bp

app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = "ids-super-secret-key-2024"
jwt = JWTManager(app)

app.register_blueprint(auth_bp)

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

event_queue = queue.Queue()

@app.route("/predict", methods=["POST"])
@jwt_required()
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

    result = {
        "prediction": prediction,
        "confidence": confidence,
        "probabilities": all_probs,
        "meta": CATEGORY_META.get(prediction, {})
    }

    event_queue.put(result)
    return jsonify(result)

@app.route("/stream")
@jwt_required(locations=["query_string"])
def stream():
    def event_gen():
        while True:
            try:
                data = event_queue.get(timeout=30)
                yield f"data: {json.dumps(data)}\n\n"
            except queue.Empty:
                yield "data: {}\n\n"
    return Response(event_gen(), mimetype="text/event-stream")

@app.route("/features", methods=["GET"])
@jwt_required()
def get_features():
    return jsonify({"features": feature_names})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "running"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)