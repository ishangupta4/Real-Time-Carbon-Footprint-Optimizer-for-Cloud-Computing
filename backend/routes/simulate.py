from flask import Blueprint, request, jsonify
from services.simulator import workload_simulator

simulate_bp = Blueprint('simulate', __name__)


@simulate_bp.route('/simulate', methods=['POST'])
def generate_workloads():
    """
    Generate simulated workloads for testing.
    
    Request Body:
    {
        "count": 100,
        "time_span_hours": 24,
        "mode": "normal"  // or "burst"
    }
    
    Response:
    {
        "success": true,
        "workloads": [...],
        "count": 100
    }
    """
    try:
        data = request.get_json() or {}
        
        count = min(int(data.get('count', 50)), 1000)  # Max 1000
        time_span = float(data.get('time_span_hours', 24))
        mode = data.get('mode', 'normal')
        
        if mode == 'burst':
            workloads = workload_simulator.generate_burst_workload(
                count=count,
                burst_duration_minutes=time_span * 60
            )
        else:
            workloads = workload_simulator.generate_workloads(
                count=count,
                time_span_hours=time_span
            )
        
        return jsonify({
            'success': True,
            'workloads': [w.to_dict() for w in workloads],
            'count': len(workloads),
            'mode': mode
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to generate workloads: {str(e)}'
        }), 500

