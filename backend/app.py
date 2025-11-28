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
    app.run(debug=True, port=4000)


# Commit 2 - Development update

# Commit 25 - Development update

# Commit 33 - Development update

# Commit 35 - Development update

# Commit 60 - Development update

# Commit 115 - Development update

# Commit 137 - Development update

# Commit 139 - Development update

# Development update 145 - 2025-12-03

# Development update 173 - 2025-12-03
