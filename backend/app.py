# File: backend/app.py

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
from routes.upload import upload_bp  # NEW: Upload route

# Register blueprints
app.register_blueprint(optimize_bp, url_prefix='/api')
app.register_blueprint(carbon_bp, url_prefix='/api')
app.register_blueprint(datacenters_bp, url_prefix='/api')
app.register_blueprint(simulate_bp, url_prefix='/api')
app.register_blueprint(compare_bp, url_prefix='/api')
app.register_blueprint(upload_bp, url_prefix='/api')  # NEW


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/debug-carbon-api', methods=['GET'])
def debug_carbon_api():
    """
    Diagnostic endpoint to see raw UK Carbon Intensity API response
    """
    import requests
    import json
    
    BASE_URL = "https://api.carbonintensity.org.uk"
    
    try:
        response = requests.get(f"{BASE_URL}/regional", timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Get first region to inspect structure
        regions = data.get('data', [])
        
        result = {
            'raw_response_keys': list(data.keys()),
            'num_regions': len(regions),
            'first_region_raw': regions[0] if regions else None,
            'all_regions_summary': []
        }
        
        # Inspect each region's structure
        for region in regions[:3]:  # Just first 3 for brevity
            region_id = region.get('regionid')
            shortname = region.get('shortname')
            
            # Get the data array
            region_data = region.get('data', [])
            
            # Check what's actually in the intensity field
            if region_data:
                first_data = region_data[0]
                intensity_raw = first_data.get('intensity')
                
                result['all_regions_summary'].append({
                    'regionid': region_id,
                    'shortname': shortname,
                    'data_array_length': len(region_data),
                    'first_data_keys': list(first_data.keys()) if first_data else None,
                    'intensity_raw': intensity_raw,
                    'intensity_type': str(type(intensity_raw)),
                    'intensity_forecast': intensity_raw.get('forecast') if isinstance(intensity_raw, dict) else 'NOT A DICT',
                    'intensity_actual': intensity_raw.get('actual') if isinstance(intensity_raw, dict) else 'NOT A DICT',
                })
            else:
                result['all_regions_summary'].append({
                    'regionid': region_id,
                    'shortname': shortname,
                    'data_array_length': 0,
                    'error': 'No data array'
                })
        
        return json.dumps(result, indent=2, default=str), 200, {'Content-Type': 'application/json'}
        
    except Exception as e:
        import traceback
        return {
            'error': str(e),
            'traceback': traceback.format_exc()
        }, 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)