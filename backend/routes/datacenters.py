from flask import Blueprint, jsonify
from models.datacenter import DEFAULT_DATACENTERS
from services.carbon_api import carbon_client

datacenters_bp = Blueprint('datacenters', __name__)


@datacenters_bp.route('/datacenters', methods=['GET'])
def get_datacenters():
    """
    Get all available datacenters with current status.
    
    Response:
    {
        "success": true,
        "datacenters": [
            {
                "id": "UK-North",
                "name": "UK North",
                "location": "Manchester, UK",
                "coordinates": {"lat": 53.48, "lng": -2.24},
                "capacity": {...},
                "carbon": {...}
            }
        ]
    }
    """
    try:
        
        carbon_data = carbon_client.get_current_intensity()
        
        
        datacenters = []
        for dc in DEFAULT_DATACENTERS:
            dc_dict = dc.to_dict()
            
            
            if dc.id in carbon_data:
                dc_dict['carbon'] = {
                    'intensity': carbon_data[dc.id].get('intensity', 200),
                    'renewable_percentage': carbon_data[dc.id].get('renewable', 30),
                    'index': carbon_data[dc.id].get('index', 'moderate'),
                    'generation_mix': carbon_data[dc.id].get('generation_mix', {})
                }
            
            datacenters.append(dc_dict)
        
        return jsonify({
            'success': True,
            'datacenters': datacenters,
            'count': len(datacenters)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to fetch datacenters: {str(e)}'
        }), 500


@datacenters_bp.route('/datacenters/<dc_id>', methods=['GET'])
def get_datacenter(dc_id):
    """Get specific datacenter details"""
    try:
        dc = next((d for d in DEFAULT_DATACENTERS if d.id == dc_id), None)
        
        if not dc:
            return jsonify({
                'success': False,
                'error': f'Datacenter {dc_id} not found'
            }), 404
        
        carbon_data = carbon_client.get_current_intensity()
        dc_dict = dc.to_dict()
        
        if dc_id in carbon_data:
            dc_dict['carbon'] = carbon_data[dc_id]
        
        return jsonify({
            'success': True,
            'datacenter': dc_dict
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

