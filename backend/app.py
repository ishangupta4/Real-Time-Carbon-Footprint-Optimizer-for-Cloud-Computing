from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Import routes
from routes.optimize import optimize_bp
from routes.carbon import carbon_bp
from routes.datacenters import datacenters_bp
from routes.simulate import simulate_bp
from routes.compare import compare_bp
from routes.upload import upload_bp  


# Register blueprints
app.register_blueprint(optimize_bp, url_prefix='/api')
app.register_blueprint(carbon_bp, url_prefix='/api')
app.register_blueprint(datacenters_bp, url_prefix='/api')
app.register_blueprint(simulate_bp, url_prefix='/api')
app.register_blueprint(compare_bp, url_prefix='/api')
app.register_blueprint(upload_bp, url_prefix='/api')  


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)