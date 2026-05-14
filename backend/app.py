@app.route("/stream")
def stream():
    token = request.args.get("token", "")
    try:
        decode_token(token)
    except Exception:
        return jsonify({"error": "Unauthorized"}), 401

    def event_gen():
        while True:
            try:
                data = event_queue.get(timeout=30)
                yield f"data: {json.dumps(data)}\n\n"
            except queue.Empty:
                yield "data: {}\n\n"

    response = Response(event_gen(), mimetype="text/event-stream")
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"
    return response