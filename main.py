from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/trades')
def index():
    return jsonify({"trades": ["Hello, World!"], "message": "Hello, World!", "success": True})

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)