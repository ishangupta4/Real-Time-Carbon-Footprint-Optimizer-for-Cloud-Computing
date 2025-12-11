from flask import Blueprint, request, jsonify
from services.carbon_api import carbon_client

carbon_bp = Blueprint('carbon', __name__)


@carbon_bp.route('/carbon-intensity', methods=['GET'])
def get_carbon_intensity():
    """
    Get current carbon intensity for all datacenters.
    
    Query Parameters:
        - regions: comma-separated list of datacenter IDs (optional)
        - include_forecast: boolean (default: false)
    
    Response:
    {
        "success": true,
        "data": {
            "UK-North": {
                "intensity": 142.5,
                "renewable": 65.3,
                "generation_mix": {...}
            }
        },
        "timestamp": "2025-12-10T14:00:00Z"
    }
    """
    try:
        
        regions = request.args.get('regions')
        include_forecast = request.args.get('include_forecast', 'false').lower() == 'true'
        
        
        carbon_data = carbon_client.get_current_intensity()
        
        
        if regions:
            region_list = [r.strip() for r in regions.split(',')]
            carbon_data = {k: v for k, v in carbon_data.items() if k in region_list}
        
        response = {
            'success': True,
            'data': carbon_data,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        
        if include_forecast:
            forecast = carbon_client.get_forecast(24)
            
            forecast_json = {
                f"{dc_id}_{hour}": data 
                for (dc_id, hour), data in forecast.items()
            }
            response['forecast'] = forecast_json
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to fetch carbon data: {str(e)}'
        }), 500


@carbon_bp.route('/carbon-intensity/forecast', methods=['GET'])
def get_carbon_forecast():
    """
    Get carbon intensity forecast for next N hours.
    
    Query Parameters:
        - hours: number of hours (default: 24, max: 48)
    """
    try:
        hours = min(int(request.args.get('hours', 24)), 48)
        
        forecast = carbon_client.get_forecast(hours)
        
        
        structured = {}
        for (dc_id, hour), data in forecast.items():
            if dc_id not in structured:
                structured[dc_id] = []
            structured[dc_id].append({
                'hour': hour,
                'intensity': data.get('intensity'),
                'renewable': data.get('renewable')
            })
        
        
        for dc_id in structured:
            structured[dc_id].sort(key=lambda x: x['hour'])
        
        return jsonify({
            'success': True,
            'forecast': structured,
            'hours': hours,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to fetch forecast: {str(e)}'
        }), 500


from datetime import datetime