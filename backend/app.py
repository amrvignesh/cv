from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

from modules.assignment1 import bp as assignment1_bp
app.register_blueprint(assignment1_bp)

from modules.assignment2 import bp as assignment2_bp
app.register_blueprint(assignment2_bp)

from modules.assignment3 import bp as assignment3_bp
app.register_blueprint(assignment3_bp)

from modules.assignment4 import bp as assignment4_bp
app.register_blueprint(assignment4_bp)





@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "CV Backend is running"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)

