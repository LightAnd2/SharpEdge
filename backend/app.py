import os
import logging
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from database import init_db
from routes.odds import odds_bp
from scheduler import startup

app = Flask(__name__)

cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]
CORS(app, resources={r"/api/*": {"origins": cors_origins}})

app.register_blueprint(odds_bp, url_prefix="/api/odds")


@app.route("/api/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    startup()
    app.run(debug=os.getenv("FLASK_ENV") == "development", port=5001)
