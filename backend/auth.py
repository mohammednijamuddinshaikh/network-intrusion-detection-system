from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import bcrypt

auth_bp = Blueprint('auth', __name__)

# Hardcoded users (replace with DB in production)
USERS = {
    "admin": bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()),
    "mohammed": bcrypt.hashpw("password123".encode(), bcrypt.gensalt()),
}

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "")
    password = data.get("password", "").encode()

    hashed = USERS.get(username)
    if not hashed or not bcrypt.checkpw(password, hashed):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=username)
    return jsonify({"token": token, "username": username})