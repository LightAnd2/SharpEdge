import os
import requests
from flask import Blueprint, request, jsonify
from security import require_auth, rate_limit

alerts_bp = Blueprint("alerts", __name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


def _headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


@alerts_bp.route("/", methods=["GET"])
@require_auth
@rate_limit(max_requests=30, window=60)
def get_alerts():
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/alerts",
        headers=_headers(),
        params={"user_id": f"eq.{request.user_id}", "order": "created_at.desc"},
        timeout=10,
    )
    if resp.status_code != 200:
        return jsonify({"error": "Failed to fetch alerts"}), 500
    return jsonify(resp.json())


@alerts_bp.route("/", methods=["POST"])
@require_auth
@rate_limit(max_requests=10, window=60)
def create_alert():
    data = request.get_json(silent=True) or {}

    game_id = str(data.get("game_id", "")).strip()
    team = str(data.get("team", "")).strip()
    market = str(data.get("market", "spreads")).strip()
    target_price = data.get("target_price")
    target_point = data.get("target_point")

    if not game_id or not team:
        return jsonify({"error": "game_id and team are required"}), 400
    if target_price is None and target_point is None:
        return jsonify({"error": "target_price or target_point is required"}), 400
    if market not in ("spreads", "h2h", "totals"):
        return jsonify({"error": "Invalid market"}), 400

    payload = {
        "user_id": request.user_id,
        "game_id": game_id,
        "team": team,
        "market": market,
        "target_price": target_price,
        "target_point": target_point,
        "triggered": False,
    }

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/alerts",
        headers=_headers(),
        json=payload,
        timeout=10,
    )
    if resp.status_code not in (200, 201):
        return jsonify({"error": "Failed to create alert"}), 500

    result = resp.json()
    return jsonify(result[0] if isinstance(result, list) and result else {}), 201


@alerts_bp.route("/<alert_id>", methods=["DELETE"])
@require_auth
@rate_limit(max_requests=20, window=60)
def delete_alert(alert_id: str):
    resp = requests.delete(
        f"{SUPABASE_URL}/rest/v1/alerts",
        headers={**_headers(), "Prefer": "return=minimal"},
        params={"id": f"eq.{alert_id}", "user_id": f"eq.{request.user_id}"},
        timeout=10,
    )
    if resp.status_code not in (200, 204):
        return jsonify({"error": "Failed to delete alert"}), 500
    return "", 204
