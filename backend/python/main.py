from __future__ import annotations

import time

from flask import Flask, jsonify, request

from cleaner import clean_html
from extractor import (
    classify_employment,
    classify_role,
    classify_seniority,
    derive_search_text,
    extract_experience,
    extract_skills,
    is_remote,
)


app = Flask(__name__)


@app.get("/health")
def health() -> tuple:
    return jsonify({"status": "ok", "service": "enrich"}), 200


@app.post("/enrich")
def enrich() -> tuple:
    body = request.get_json(silent=True) or {}
    raw_html = body.get("rawHtml") or body.get("descriptionHtml") or ""
    plain_input = body.get("plainText") or ""

    plain = (plain_input or clean_html(raw_html)).strip()
    if not plain:
        return jsonify({
            "plainText": "",
            "skills": [],
            "experience": "",
            "seniority": "mid",
            "role": "engineering",
            "remote": False,
            "employmentType": "full-time",
            "searchText": "",
            "elapsedMs": 0,
        }), 200

    started = time.perf_counter()
    skills = extract_skills(plain)
    payload = {
        "plainText": plain,
        "skills": skills,
        "experience": extract_experience(plain),
        "seniority": classify_seniority(plain),
        "role": classify_role(plain),
        "remote": is_remote(plain),
        "employmentType": classify_employment(plain),
        "searchText": derive_search_text(plain, skills),
        "elapsedMs": int((time.perf_counter() - started) * 1000),
    }
    return jsonify(payload), 200


@app.errorhandler(404)
def not_found(_err):
    return jsonify({"error": {"code": "not-found", "message": "Route not found"}}), 404


@app.errorhandler(500)
def server_error(err):
    app.logger.exception("internal error: %s", err)
    return jsonify({"error": {"code": "internal", "message": str(err)}}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
